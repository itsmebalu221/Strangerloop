/**
 * Live layer — connects the client to the strangrloop server (server/)
 * when VITE_SERVER_URL is set. Without it, the app stays in local
 * simulation mode and this module is inert.
 */
import { io, type Socket } from "socket.io-client";
import { LIVE_ENABLED, SERVER_URL } from "./config";
import { getSupabase } from "./auth";
import type { LiveStats } from "./types";

let socket: Socket | null = null;
/** memoized so concurrent callers share one connection instead of racing */
let connecting: Promise<Socket> | null = null;
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
  try {
    const supabase = getSupabase();
    if (!supabase) return "";
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  } catch {
    return "";
  }
}

export const liveEnabled = LIVE_ENABLED;

export function getLiveSocket(): Promise<Socket> {
  if (socket) return Promise.resolve(socket);
  if (!LIVE_ENABLED) return Promise.reject(new Error("Live server is not configured."));
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await supabaseToken().catch(() => "");
    const s = io(SERVER_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
    });
    socket = s;
    s.on("stats", (st: LiveStats) => statsListeners.forEach((cb) => cb(st)));
    s.on("disconnect", () => {
      if (socket === s) socket = null;
      connecting = null;
    });
    return s;
  })();

  connecting.catch(() => {
    connecting = null;
  });
  return connecting;
}

export function liveSocket(): Socket | null {
  return socket;
}

/** Tear down the live connection (sign-out / account switch). */
export function closeLiveSocket(): void {
  connecting = null;
  if (!socket) return;
  const s = socket;
  socket = null;
  s.removeAllListeners();
  s.disconnect();
}

export function onLiveStats(cb: (s: LiveStats) => void): () => void {
  statsListeners.add(cb);
  return () => {
    statsListeners.delete(cb);
  };
}
