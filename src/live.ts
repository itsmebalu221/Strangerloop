/**
 * Live client — connects the browser to the StrangrLoop server (server/).
 * Only active when VITE_SERVER_URL is set (see src/config.ts → LIVE_ENABLED).
 * Exposes: the socket singleton, a REST helper, live stats subscription,
 * and connection sync.
 */
import { io, type Socket } from "socket.io-client";
import { LIVE_ENABLED, SERVER_URL } from "./config";
import { getAuthToken } from "./auth";
import type { LiveStats, PublicProfile } from "./types";

let socket: Socket | null = null;
const statsListeners = new Set<(s: LiveStats) => void>();

export function liveSocket(): Socket | null {
  return socket;
}

export function getLiveSocket(): Promise<Socket> {
  if (!LIVE_ENABLED) return Promise.reject(new Error("Live mode disabled — set VITE_SERVER_URL."));
  if (socket) return Promise.resolve(socket);
  return getAuthToken().then((token) => {
    socket = io(SERVER_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      timeout: 8000,
    });
    socket.on("stats", (s: LiveStats) => statsListeners.forEach((cb) => cb(s)));
    return socket;
  });
}

export function onLiveStats(cb: (s: LiveStats) => void): () => void {
  statsListeners.add(cb);
  return () => {
    statsListeners.delete(cb);
  };
}

/** Authenticated REST call against the live server. */
export async function liveRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

interface ServerConnection {
  id: number;
  createdAt: number;
  peer: PublicProfile;
}

/** Fetch my connections from the server. */
export function fetchLiveConnections(): Promise<ServerConnection[]> {
  return liveRest<ServerConnection[]>("/connections");
}
