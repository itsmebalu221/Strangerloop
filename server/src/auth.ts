/**
 * Identity resolution for REST + socket handshakes.
 *
 * supabase mode — verifies the Supabase access token (HS256, project JWT secret).
 * demo mode     — accepts `demo:<userId>` tokens issued by the client's local
 *                 demo auth. Clearly dev-only: enable real auth by setting
 *                 SUPABASE_JWT_SECRET.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { AUTH_MODE, SUPABASE_URL, SUPABASE_JWT_SECRET } from "./config.js";
import * as db from "./db.js";

export interface Identity {
  userId: string;
  email?: string;
  provider: "google" | "email" | "demo";
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function verifySupabaseJwt(token: string): Identity {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");

  const header = JSON.parse(b64urlDecode(parts[0]).toString("utf8")) as { alg?: string };
  if (header.alg !== "HS256") throw new Error("Unsupported algorithm");

  const expected = createHmac("sha256", SUPABASE_JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = b64urlDecode(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("Invalid signature");

  const payload = JSON.parse(b64urlDecode(parts[1]).toString("utf8")) as {
    sub?: string;
    exp?: number;
    iss?: string;
    email?: string;
    app_metadata?: { provider?: string };
  };
  if (!payload.sub) throw new Error("Token missing subject");
  if (payload.exp && payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  if (SUPABASE_URL && payload.iss && payload.iss !== `${SUPABASE_URL}/auth/v1`) throw new Error("Unexpected issuer");

  return {
    userId: payload.sub,
    email: payload.email,
    provider: payload.app_metadata?.provider === "google" ? "google" : "email",
  };
}

/** Resolve a bearer token to an identity, creating the user row on first sight. */
export function resolveToken(token: string | undefined): Identity {
  if (!token) throw new Error("Missing token");

  if (AUTH_MODE === "demo") {
    const m = /^demo:([A-Za-z0-9_-]{4,64})$/.exec(token);
    if (!m) throw new Error("Invalid demo token — expected demo:<userId>");
    const id = `demo_${m[1]}`;
    const existing = db.getUser(id);
    db.ensureUser(id, existing?.display_name ?? `Stranger${m[1].slice(0, 4)}`);
    return { userId: id, provider: "demo" };
  }

  const id = verifySupabaseJwt(token);
  const existing = db.getUser(id.userId);
  db.ensureUser(id.userId, existing?.display_name ?? id.email?.split("@")[0] ?? "Stranger");
  return id;
}

/** Express-style bearer extraction helper. */
export function bearer(headers: { authorization?: string }): string | undefined {
  const h = headers.authorization ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : undefined;
}
