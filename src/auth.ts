/**
 * Auth service for StrangrLoop.
 *
 * Two backends behind one API:
 *  • Supabase Auth — used automatically when VITE_SUPABASE_URL and
 *    VITE_SUPABASE_ANON_KEY are set. Supports Google OAuth + email/password.
 *  • Demo auth — browser-local accounts (localStorage) so the app is fully
 *    usable with zero setup. NOT for production: passwords are only hashed
 *    with djb2 and never leave the browser.
 *
 * The rest of the app never knows which mode is active.
 */
import { createClient } from "@supabase/supabase-js";
import type { AuthUser } from "./types";
import { APP_URL, DEMO_AUTH_ENABLED, SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "./config";

const ACCOUNTS_KEY = "strangrloop:accounts";
const SESSION_KEY = "strangrloop:session";

const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const authMode = SUPABASE_CONFIGURED ? ("supabase" as const) : ("demo" as const);
export const googleSignInAvailable = SUPABASE_CONFIGURED;

/** Shared Supabase client for modules that need session tokens (e.g. live.ts). */
export function getSupabase() {
  return supabase;
}

/* ================= supabase mapping ================= */
function mapSupaUser(u: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): AuthUser {
  const email = u.email ?? "";
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string };
  const provider: AuthUser["provider"] = u.app_metadata?.provider === "google" ? "google" : "email";
  return {
    id: u.id,
    email,
    name: meta.full_name || meta.name || (email ? email.split("@")[0] : "stranger"),
    provider,
  };
}

/* ================= demo implementation ================= */
interface DemoAccount {
  email: string;
  name: string;
  hash: string;
  id: string;
  provider: AuthUser["provider"];
}

/** djb2 — demo-only. Real password hashing happens server-side in Supabase. */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `djb2_${(h >>> 0).toString(16)}`;
}

function uid(): string {
  return `demo_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function readAccounts(): Record<string, DemoAccount> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "{}") as Record<string, DemoAccount>;
  } catch {
    return {};
  }
}

function writeAccounts(accounts: Record<string, DemoAccount>) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readSession(): DemoAccount | null {
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return readAccounts()[email] ?? null;
}

function toAuthUser(a: DemoAccount): AuthUser {
  return { id: a.id, email: a.email, name: a.name, provider: a.provider };
}

const demoListeners = new Set<(u: AuthUser | null) => void>();
function notifyDemo(u: AuthUser | null) {
  demoListeners.forEach((cb) => cb(u));
}

async function demoSignUp(email: string, password: string): Promise<AuthUser> {
  const accounts = readAccounts();
  const key = email.trim().toLowerCase();
  if (accounts[key]) throw new Error("An account with this email already exists — try signing in.");
  const acc: DemoAccount = { email: key, name: key.split("@")[0], hash: hash(password), id: uid(), provider: "email" };
  accounts[key] = acc;
  writeAccounts(accounts);
  localStorage.setItem(SESSION_KEY, key);
  const user = toAuthUser(acc);
  notifyDemo(user);
  return user;
}

async function demoSignIn(email: string, password: string): Promise<AuthUser> {
  const acc = readAccounts()[email.trim().toLowerCase()];
  if (!acc) throw new Error("No account found for this email — create one first.");
  if (acc.hash !== hash(password)) throw new Error("Incorrect password. Try again.");
  localStorage.setItem(SESSION_KEY, acc.email);
  const user = toAuthUser(acc);
  notifyDemo(user);
  return user;
}

async function demoGuest(): Promise<AuthUser> {
  const n = Math.floor(1000 + Math.random() * 9000);
  const email = `guest${n}@demo.strangrloop.chat`;
  const acc: DemoAccount = { email, name: `Guest${n}`, hash: hash(uid()), id: uid(), provider: "demo" };
  const accounts = readAccounts();
  accounts[email] = acc;
  writeAccounts(accounts);
  localStorage.setItem(SESSION_KEY, email);
  const user = toAuthUser(acc);
  notifyDemo(user);
  return user;
}

/* ================= public API ================= */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ? mapSupaUser(data.session.user) : null;
  }
  const s = readSession();
  return s ? toAuthUser(s) : null;
}

/**
 * Bearer token for the live server (sockets + REST).
 *  • supabase mode → the Supabase access token (JWT, verified server-side)
 *  • demo mode     → "demo:<userId>" accepted by the server in dev
 */
export async function getAuthToken(): Promise<string | undefined> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? undefined;
  }
  const s = readSession();
  return s ? `demo:${s.id}` : undefined;
}

export function onAuthChange(cb: (u: AuthUser | null) => void): () => void {
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(session?.user ? mapSupaUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }
  demoListeners.add(cb);
  const s = readSession();
  cb(s ? toAuthUser(s) : null);
  return () => {
    demoListeners.delete(cb);
  };
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    throw new Error("Google sign-in needs Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env — see README.md.");
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: APP_URL || window.location.origin },
  });
  if (error) throw new Error(error.message);
  // Supabase redirects the browser to Google; nothing further to do here.
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: APP_URL || undefined },
    });
    if (error) throw new Error(friendly(error.message));
    if (!data.session && data.user) {
      throw new Error("Almost there — check your inbox to confirm your email, then sign in.");
    }
    if (!data.user) throw new Error("Something went wrong while creating your account.");
    return mapSupaUser(data.user);
  }
  if (!DEMO_AUTH_ENABLED) throw new Error("Email sign-up is disabled. Configure Supabase in .env to enable real auth.");
  return demoSignUp(email, password);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendly(error.message));
    if (!data.user) throw new Error("Sign-in failed. Please try again.");
    return mapSupaUser(data.user);
  }
  if (!DEMO_AUTH_ENABLED) throw new Error("Email sign-in is disabled. Configure Supabase in .env to enable real auth.");
  return demoSignIn(email, password);
}

export async function continueAsGuest(): Promise<AuthUser> {
  if (supabase) throw new Error("Guest mode is only available in demo builds.");
  return demoGuest();
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  localStorage.removeItem(SESSION_KEY);
  notifyDemo(null);
}

function friendly(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Incorrect email or password.";
  if (/already registered/i.test(msg)) return "That email already has an account — try signing in.";
  if (/at least 6 characters/i.test(msg)) return "Password must be at least 6 characters.";
  if (/valid email/i.test(msg)) return "That doesn't look like a valid email address.";
  if (/rate limit/i.test(msg)) return "Too many attempts — wait a moment and try again.";
  return msg;
}
