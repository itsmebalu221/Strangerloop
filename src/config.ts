/**
 * Central app configuration — every tunable string and credential reference
 * lives here, fed by `.env` (see `.env.example`). Only VITE_-prefixed vars
 * are exposed to the client by Vite.
 */
const env = import.meta.env;

/* ---------- app identity ---------- */
export const APP_NAME = env.VITE_APP_NAME?.trim() || "StrangrLoop";
export const APP_URL = env.VITE_APP_URL?.trim() || (typeof window !== "undefined" ? window.location.origin : "");
export const TAGLINE = "Random chats. Real wavelength.";

/* ---------- auth ---------- */
export const SUPABASE_URL = env.VITE_SUPABASE_URL?.trim() || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY?.trim() || "";
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Demo auth (browser-local accounts) fills in when Supabase keys are absent. */
export const DEMO_AUTH_ENABLED = (env.VITE_ENABLE_DEMO_AUTH?.trim() ?? "true") !== "false";

export type AuthMode = "supabase" | "demo";
export const AUTH_MODE: AuthMode = SUPABASE_CONFIGURED ? "supabase" : "demo";
