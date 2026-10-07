/**
 * Real-time layer — Socket.IO.
 *
 *   queue:join / queue:leave     matching queue (server-side scoring)
 *   match:found                  emitted to both users when paired
 *   chat:message / chat:typing   relayed through moderation + rate limits
 *   connect:request / accepted   mutual opt-in connections
 *   chat:next / block / report   session lifecycle
 *   stats                        broadcast presence every few seconds
 */
import { Server, type Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { AUTH_MODE, ALLOW_ALL_ORIGINS, CLIENT_ORIGINS, STATS_INTERVAL_MS, type Prefs } from "./config.js";
import { resolveToken, type Identity } from "./auth.js";
import * as db from "./db.js";
import * as match from "./matching.js";
import { accountAllowed, canJoinQueue, consumeMessageToken, moderate, startModerationJanitor, stopModerationJanitor, trackBody } from "./moderation.js";
import { sanitizePrefs } from "./matching.js";

const socketsByUser = new Map<string, Socket>();
const lastTypingAt = new Map<string, number>();
const reportTimes = new Map<string, number[]>();

/** max 3 reports per user per minute — abuse-proofing the auto-restrict path */
function canReport(userId: string): boolean {
  const now = Date.now();
  const times = (reportTimes.get(userId) ?? []).filter((t) => now - t < 60_000);
  reportTimes.set(userId, times);
  if (times.length >= 3) return false;
  times.push(now);
  return true;
}

export function getLiveStats() {
  return {
    online: socketsByUser.size,
    searching: match.queueSize(),
    activeChats: match.activeSessionCount(),
    matchedToday: db.matchedToday(),
  };
}

export function stopStatsLoop(statsTimer?: ReturnType<typeof setInterval>): void {
  if (statsTimer) clearInterval(statsTimer);
  lastTypingAt.clear();
  reportTimes.clear();
  stopModerationJanitor();
}

export function attachSockets(http: HttpServer): { io: Server; statsTimer: ReturnType<typeof setInterval> } {
  const io = new Server(http, {
    cors: { origin: ALLOW_ALL_ORIGINS ? true : CLIENT_ORIGINS },
  });

  /* auth handshake */
  io.use((socket, next) => {
    try {
      const header = socket.handshake.headers.authorization ?? "";
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (header.startsWith("Bearer ") ? header.slice(7) : undefined) ??
        undefined;
      socket.data.identity = resolveToken(token);
      next();
    } catch (e) {
      next(new Error(e instanceof Error ? e.message : "Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const ident = socket.data.identity as Identity;
    const userId = ident.userId;
    db.ensureUser(userId, ident.email ? ident.email.split("@")[0] : userId.replace("demo_", "guest"));

    // one active connection per user
    const prev = socketsByUser.get(userId);
    if (prev && prev.id !== socket.id) prev.disconnect(true);
    socketsByUser.set(userId, socket);
    socket.join(`user:${userId}`);
    socket.emit("welcome", { userId, auth: AUTH_MODE });

    /* ---------- queue ---------- */
    socket.on("queue:join", (payload?: { prefs?: unknown }) => {
      const gate = accountAllowed(userId);
      if (!gate.ok) return socket.emit("queue:error", { message: gate.reason });
      if (!canJoinQueue(userId)) return socket.emit("queue:error", { message: "Easy there — too many searches in a row." });

      const row = db.getUser(userId);
      if (!row) return socket.emit("queue:error", { message: "Profile not found — finish onboarding first." });
      const profile = db.toPublic(row);
      if (profile.interests.length === 0) return socket.emit("queue:error", { message: "Pick at least one interest before matching." });

      // never trust client prefs raw — malformed shapes used to crash pairing
      const stored = db.getPrefs(row) ?? {
        genderPref: "anyone" as const,
        agePref: ["18–24", "25–34", "35–44", "45+"] as Prefs["agePref"],
        languages: profile.languages,
        conversationTypes: profile.conversationTypes,
      };
      const prefs = sanitizePrefs(payload?.prefs, stored);
      if (payload?.prefs) db.savePrefs(userId, prefs);

      // leaving an old session to re-queue (the NEXT flow)
      const stale = match.userInSession(userId);
      if (stale) {
        const s = match.getSession(stale);
        match.endChat(stale, "next");
        const peer = s && s.a === userId ? s.b : s?.a;
        if (peer) io.to(`user:${peer}`).emit("chat:ended", { sessionId: stale, reason: "next" });
      }

      match.joinQueue({
        userId,
        socketId: socket.id,
        profile,
        prefs,
        since: Date.now(),
        emit: (event, p) => socket.emit(event, p),
      });
      socket.emit("queue:joined", { searching: match.queueSize() });
    });

    socket.on("queue:leave", () => match.leaveQueue(userId));

    /* ---------- chat ---------- */
    socket.on("chat:message", (payload: { sessionId?: string; text?: unknown }) => {
      const sid = typeof payload?.sessionId === "string" ? payload.sessionId : undefined;
      const s = sid ? match.getSession(sid) : undefined;
      if (!s || (s.a !== userId && s.b !== userId)) return;
      if (!consumeMessageToken(userId)) return socket.emit("chat:throttled", {});

      const text = typeof payload.text === "string" ? payload.text : "";
      const { verdict, body } = moderate(userId, text);
      trackBody(userId, body);
      if (!body.trim()) return;

      if (verdict.risk === "high") return socket.emit("chat:blocked", { category: verdict.category });
      if (verdict.risk === "severe") {
        match.endChat(sid!, "moderation");
        io.to(`user:${s.a}`).emit("chat:terminated", { sessionId: sid, reason: verdict.category });
        io.to(`user:${s.b}`).emit("chat:terminated", { sessionId: sid, reason: verdict.category });
        return;
      }

      db.logMessage(sid!, userId, body, verdict.risk);
      const out = { sessionId: sid, from: userId, text: body, at: Date.now() };
      io.to(`user:${s.a}`).emit("chat:message", out);
      io.to(`user:${s.b}`).emit("chat:message", out);
      if (verdict.risk === "suspicious") socket.emit("chat:warn", { category: verdict.category });
    });

    socket.on("chat:typing", (payload: { sessionId?: string }) => {
      const sid = payload?.sessionId;
      const s = typeof sid === "string" ? match.getSession(sid) : undefined;
      if (!s || (s.a !== userId && s.b !== userId)) return;
      const now = Date.now();
      if (now - (lastTypingAt.get(userId) ?? 0) < 700) return; // relay throttle
      lastTypingAt.set(userId, now);
      const peer = s.a === userId ? s.b : s.a;
      io.to(`user:${peer}`).emit("chat:typing", { sessionId: sid, from: userId });
    });

    socket.on("chat:next", (payload: { sessionId?: string }) => {
      const sid = payload?.sessionId;
      const s = typeof sid === "string" ? match.getSession(sid) : undefined;
      if (!s || (s.a !== userId && s.b !== userId)) return;
      match.endChat(sid!, "next");
      const peer = s.a === userId ? s.b : s.a;
      io.to(`user:${peer}`).emit("chat:ended", { sessionId: sid, reason: "next" });
    });

    /* ---------- connect ---------- */
    socket.on("connect:request", (payload: { sessionId?: string }) => {
      const sid = payload?.sessionId;
      const s = typeof sid === "string" ? match.getSession(sid) : undefined;
      if (!s || (s.a !== userId && s.b !== userId)) return;
      const mutual = match.requestConnect(sid!, userId); // persists on mutual
      const row = db.getUser(userId);
      if (mutual) {
        io.to(`user:${s.a}`).emit("connect:established", { sessionId: sid });
        io.to(`user:${s.b}`).emit("connect:established", { sessionId: sid });
      } else {
        const peer = s.a === userId ? s.b : s.a;
        io.to(`user:${peer}`).emit("connect:incoming", { sessionId: sid, from: row ? db.toPublic(row) : { id: userId, name: "someone" } });
      }
    });

    /* ---------- safety ---------- */
    socket.on("report", (payload: { sessionId?: string; reported?: string; reason?: string; details?: string }) => {
      if (!payload?.reported || !payload?.reason) return;
      if (typeof payload.reported !== "string" || typeof payload.reason !== "string") return;
      if (!canReport(userId)) return socket.emit("report:received", { error: "Too many reports — try again shortly." });
      const severe = payload.reason === "underage" || payload.reason === "threats";
      const id = db.insertReport({
        reporter: userId,
        reported: payload.reported.slice(0, 64),
        reason: payload.reason.slice(0, 32),
        details: String(payload.details ?? "").slice(0, 500),
        severity: severe ? "severe" : "high",
        session: typeof payload.sessionId === "string" ? payload.sessionId : null,
      });
      if (severe) {
        db.setUserStatus(payload.reported, "restricted");
        db.logModEvent(payload.reported, "restrict", payload.reason, `auto-restricted via report #${id}`);
      }
      db.blockUser(userId, payload.reported, `report:${payload.reason}`);
      // the UI promises "conversation ends immediately" — honor it for both sides
      const sid = payload.sessionId;
      const s = typeof sid === "string" ? match.getSession(sid) : undefined;
      if (s && (s.a === userId || s.b === userId)) {
        match.endChat(sid!, "report");
        const peer = s.a === userId ? s.b : s.a;
        io.to(`user:${peer}`).emit("chat:ended", { sessionId: sid, reason: "block" });
      }
      socket.emit("report:received", { reportId: id });
    });

    socket.on("block", (payload: { userId?: string; sessionId?: string }) => {
      if (typeof payload?.userId !== "string") return;
      db.blockUser(userId, payload.userId, "blocked");
      const sid = payload.sessionId;
      const s = typeof sid === "string" ? match.getSession(sid) : undefined;
      if (s && (s.a === userId || s.b === userId)) {
        match.endChat(sid!, "block");
        const peer = s.a === userId ? s.b : s.a;
        io.to(`user:${peer}`).emit("chat:ended", { sessionId: sid, reason: "block" });
      }
    });

    /* ---------- lifecycle ---------- */
    socket.on("disconnect", () => {
      if (socketsByUser.get(userId)?.id === socket.id) {
        socketsByUser.delete(userId);
        lastTypingAt.delete(userId);
      }
      match.leaveBySocket(socket.id);
      const sid = match.userInSession(userId);
      if (sid) {
        const s = match.getSession(sid);
        match.endChat(sid, "disconnect");
        const peer = s && s.a === userId ? s.b : s?.a;
        if (peer) io.to(`user:${peer}`).emit("chat:ended", { sessionId: sid, reason: "disconnect" });
      }
    });
  });

  /* pairing results → both clients */
  match.setPairHandler((a, b, matchA, matchB) => {
    a.emit("match:found", matchA);
    b.emit("match:found", matchB);
  });
  match.startPairingLoop();
  startModerationJanitor();

  /* presence broadcast */
  const statsTimer = setInterval(() => io.emit("stats", getLiveStats()), STATS_INTERVAL_MS);

  return { io, statsTimer };
}
