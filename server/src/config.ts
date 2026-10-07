/**
 * Server configuration + wire types shared by REST, sockets and the client.
 * Every value comes from the environment (see README → "Running the server").
 */
const env = process.env;

const portNum = Number(env.PORT);
export const PORT = Number.isFinite(portNum) && portNum > 0 ? portNum : 8787;
export const HOST = env.HOST ?? "0.0.0.0";
/** Set to a built frontend directory (e.g. ../dist) to serve the SPA from this server. */
export const STATIC_DIR = env.STATIC_DIR?.trim() ?? "";
/** Enable when running behind a reverse proxy that sets X-Forwarded-* headers. */
export const TRUST_PROXY = env.TRUST_PROXY === "true";

/** Comma-separated origins allowed for CORS + socket handshake ("*" allows any). */
export const CLIENT_ORIGINS = (env.CLIENT_ORIGIN ?? "http://localhost:3000,http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const ALLOW_ALL_ORIGINS = CLIENT_ORIGINS.includes("*");

export const DB_PATH = env.DATABASE_PATH ?? "./strangrloop.db";

/* ---------- auth ---------- */
export type AuthMode = "supabase" | "demo";
export const SUPABASE_URL = env.SUPABASE_URL?.trim() ?? "";
export const SUPABASE_JWT_SECRET = env.SUPABASE_JWT_SECRET?.trim() ?? "";
/** supabase when a JWT secret is provided, demo otherwise (dev only). */
export const AUTH_MODE: AuthMode = SUPABASE_JWT_SECRET ? "supabase" : "demo";

export const ADMIN_TOKEN = env.ADMIN_TOKEN?.trim() ?? "";

/* ---------- tuning ---------- */
export const PAIRING_INTERVAL_MS = 2000;
export const STATS_INTERVAL_MS = 3000;
export const MAX_MESSAGE_LENGTH = 500;
export const MESSAGE_BURST_CAPACITY = 15;
export const MESSAGE_BURST_REFILL_PER_SEC = 1.2;

/* ================= wire types (mirror src/types.ts on the client) ================= */
export type Gender = "male" | "female" | "nonbinary" | "private";
export type GenderPref = "anyone" | "male" | "female" | "other";
export type AgeRange = "18–24" | "25–34" | "35–44" | "45+";

export interface Prefs {
  genderPref: GenderPref;
  agePref: AgeRange[];
  languages: string[];
  conversationTypes: string[];
}

export interface PublicProfile {
  id: string;
  name: string;
  gender: Gender;
  age: AgeRange;
  country: string;
  languages: string[];
  interests: string[];
  conversationTypes: string[];
  bio: string;
}

export interface LiveMatch {
  sessionId: string;
  peer: PublicProfile;
  shared: string[];
  sharedConv: string[];
  sharedLang: string | null;
  score: number;
  pct: number;
  level: 1 | 2 | 3 | 4 | 5;
}

export interface LiveStats {
  online: number;
  searching: number;
  activeChats: number;
  matchedToday: number;
}
