/**
 * Live layer — connects the client to the strangrloop server (server/)
 * when VITE_SERVER_URL is set. Without it, the app stays in local
 * simulation mode and this module is inert.
 */
import { io, type Socket } from "socket.io-client";
import { LIVE_ENABLED, SERVER_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "./config";
import type { LiveStats } from "./types";

let socket: Socket | null = null;
const statsListeners = new Set<(s: LiveStats) => void>();

/** Demo auth accounts are browser-local (`demo_xxx`); the server's demo mode accepts `demo:<suffix>`. */
function demoToken(): string {
  try {
    const email = localStorage.getItem("strangrloop:session");
    if (!email) return "";
    const accounts = JSON.parse(localStorage.getItem("strangrloop:accounts") ?? "{}") as Record<string, { id?: string }>;
    const id = accounts[email]?.id;
    return id && id.startsWith("demo_") ? `demo:${id.slice(5)}` : "";
  } catch {
    return "";
  }
}

async function supabaseToken(): Promise<string> {
  // token lasts ~1h (Supabase default); reconnects re-read the session
  const { createClient } = await import("@supabase/supabase-js");
  const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await c.auth.getSession();
  return data.session?.access_token ?? "";
}

export const liveEnabled = LIVE_ENABLED;

export async function getLiveSocket(): Promise<Socket> {
  if (socket) return socket;
  const token = SUPABASE_CONFIGURED ? await supabaseToken() : demoToken();
  socket = io(SERVER_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 8,
  });
  socket.on("stats", (s: LiveStats) => statsListeners.forEach((cb) => cb(s)));
  return socket;
}

export function liveSocket(): Socket | null {
  return socket;
}

export function onLiveStats(cb: (s: LiveStats) => void): () => void {
  statsListeners.add(cb);
  return () => {
    statsListeners.delete(cb);
  };
}
