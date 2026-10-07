/**
 * REST API — profiles, connections, blocks, reports, stats and the admin
 * console. Auth: bearer token resolved by ./auth.ts (Supabase JWT or demo).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { ADMIN_TOKEN, AUTH_MODE, type Prefs, type PublicProfile } from "./config.js";
import { resolveToken, type Identity } from "./auth.js";
import * as db from "./db.js";
import { getLiveStats } from "./sockets.js";
import { sanitizePrefs } from "./matching.js";

function identity(req: FastifyRequest, reply: FastifyReply): Identity | null {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
    const ident = resolveToken(token);
    db.ensureUser(ident.userId, ident.email ? ident.email.split("@")[0] : ident.userId.replace("demo_", "guest"));
    return ident;
  } catch (e) {
    reply.code(401).send({ error: e instanceof Error ? e.message : "Unauthorized" });
    return null;
  }
}

function requireAdmin(req: FastifyRequest, reply: FastifyReply): boolean {
  if (!ADMIN_TOKEN) {
    reply.code(403).send({ error: "Admin disabled — set ADMIN_TOKEN on the server." });
    return false;
  }
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(ADMIN_TOKEN);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    reply.code(401).send({ error: "Invalid admin token." });
    return false;
  }
  return true;
}

const SEVERE_REASONS = new Set(["underage", "threats"]);

const GENDERS = new Set(["male", "female", "nonbinary", "private"]);
const AGES = new Set(["18–24", "25–34", "35–44", "45+"]);
const NAME_RE = /^[a-zA-Z0-9_ ]{3,16}$/;

function strList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ ok: true, name: "strangrloop-server", auth: AUTH_MODE, uptime: process.uptime() }));

  app.get("/stats", async () => getLiveStats());

  /* ---------- profile ---------- */
  app.post("/profile", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    const body = req.body as Partial<PublicProfile> | null;
    if (!body || typeof body.name !== "string" || !NAME_RE.test(body.name.trim())) {
      return reply.code(400).send({ error: "Display name must be 3–16 characters (letters, numbers, spaces, underscores)." });
    }
    const clean: PublicProfile = {
      id: ident.userId,
      name: body.name.trim(),
      gender: GENDERS.has(String(body.gender)) ? (body.gender as PublicProfile["gender"]) : "private",
      age: AGES.has(String(body.age)) ? (body.age as PublicProfile["age"]) : "25–34",
      country: String(body.country ?? "").slice(0, 40),
      languages: strList(body.languages, 8, 24).length > 0 ? strList(body.languages, 8, 24) : ["English"],
      interests: strList(body.interests, 10, 32),
      conversationTypes: strList(body.conversationTypes, 6, 24).length > 0 ? strList(body.conversationTypes, 6, 24) : ["casual"],
      bio: String(body.bio ?? "").slice(0, 200),
    };
    db.saveProfile(ident.userId, clean);
    return { ok: true, profile: clean };
  });

  app.post("/prefs", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    const row = db.getUser(ident.userId);
    const fallback = (row ? db.getPrefs(row) : null) ?? {
      genderPref: "anyone" as const,
      agePref: ["18–24", "25–34", "35–44", "45+"] as Prefs["agePref"],
      languages: ["English"],
      conversationTypes: ["casual"],
    };
    const p = sanitizePrefs(req.body, fallback);
    db.savePrefs(ident.userId, p);
    return { ok: true };
  });

  /* ---------- connections ---------- */
  app.get("/connections", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    return { connections: db.listConnections(ident.userId) };
  });

  app.delete("/connections/:id", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    const { id } = req.params as { id: string };
    db.removeConnection(Number(id), ident.userId);
    return { ok: true };
  });

  /* ---------- blocks ---------- */
  app.get("/blocks", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    return { blocks: db.listBlocks(ident.userId) };
  });

  app.post("/blocks", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    const { userId, reason } = req.body as { userId?: string; reason?: string };
    if (!userId) return reply.code(400).send({ error: "Missing userId." });
    db.blockUser(ident.userId, userId, reason ?? "blocked");
    return { ok: true };
  });

  app.delete("/blocks/:userId", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    const { userId } = req.params as { userId: string };
    db.unblockUser(ident.userId, userId);
    return { ok: true };
  });

  /* ---------- reports ---------- */
  app.post("/reports", async (req, reply) => {
    const ident = identity(req, reply);
    if (!ident) return;
    const { reported, reason, details, sessionId } = req.body as {
      reported?: string;
      reason?: string;
      details?: string;
      sessionId?: string;
    };
    if (!reported || !reason) return reply.code(400).send({ error: "Missing reported user or reason." });
    const severity = SEVERE_REASONS.has(reason) ? "severe" : "high";
    const id = db.insertReport({
      reporter: ident.userId,
      reported,
      reason,
      details: String(details ?? "").slice(0, 500),
      severity,
      session: sessionId ?? null,
    });
    // severe categories restrict the account immediately, pending human review
    if (severity === "severe") {
      db.setUserStatus(reported, "restricted");
      db.logModEvent(reported, "restrict", reason, `auto-restricted via report #${id}`);
    }
    db.blockUser(ident.userId, reported, `report:${reason}`);
    return { ok: true, reportId: id, severity };
  });

  /* ---------- admin ---------- */
  app.get("/admin/overview", async (req, reply) => {
    if (!requireAdmin(req, reply)) return;
    const stats = getLiveStats();
    const reports = db.listReports() as { status: string }[];
    return {
      ...stats,
      openReports: reports.filter((r) => r.status === "open").length,
      totalReports: reports.length,
    };
  });

  app.get("/admin/reports", async (req, reply) => {
    if (!requireAdmin(req, reply)) return;
    return { reports: db.listReports() };
  });

  app.post("/admin/reports/:id/action", async (req, reply) => {
    if (!requireAdmin(req, reply)) return;
    const { id } = req.params as { id: string };
    const { action, userId } = req.body as { action?: string; userId?: string };
    if (!action) return reply.code(400).send({ error: "Missing action." });
    const statusMap: Record<string, string> = { dismiss: "dismissed", warn: "warned", suspend: "suspended", ban: "banned" };
    db.setReportStatus(Number(id), statusMap[action] ?? "dismissed");
    if (userId && (action === "warn" || action === "suspend" || action === "ban")) {
      db.setUserStatus(userId, action === "warn" ? "warned" : action === "suspend" ? "restricted" : "banned");
      db.logModEvent(userId, action, "admin", `report #${id}`);
    }
    return { ok: true };
  });

  app.get("/admin/users", async (req, reply) => {
    if (!requireAdmin(req, reply)) return;
    const { q } = req.query as { q?: string };
    return { users: db.searchUsers(q ?? "") };
  });
}
