/**
 * Live client — connects the browser to the StrangrLoop server (server/).
 * Only active when VITE_SERVER_URL is set (see src/config.ts → LIVE_ENABLED).
 * Exposes: the socket singleton, a REST helper, live stats subscription,
 * and connection sync.
 */
import { io, type Socket } from "socket.io-client";
import { LIVE_ENABLED, SERVER_URL } from "./config";
import { getAuthToken } from "./auth";
import type { LiveStats, Prefs, Profile, PublicProfile } from "./types";
import { ageFromBirthDate } from "./engine";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;
let cancelConnect: (() => void) | null = null;
let generation = 0;
const statsListeners = new Set<(s: LiveStats) => void>();

export function liveSocket(): Socket | null {
  return socket;
}

/** Tear down the live connection when the signed-in user changes. */
export function closeLiveSocket(): void {
  generation += 1;
  connecting = null;
  cancelConnect?.();
  if (!socket) return;
  const current = socket;
  socket = null;
  current.disconnect();
  current.removeAllListeners();
}

export function getLiveSocket(): Promise<Socket> {
  if (!LIVE_ENABLED) return Promise.reject(new Error("Live mode disabled — set VITE_SERVER_URL."));
  if (socket?.connected) return Promise.resolve(socket);
  if (connecting) return connecting;
  const version = generation;
  const attempt = getAuthToken().then((token) => {
    if (version !== generation) throw new Error("Account changed while connecting.");
    if (!token) throw new Error("Sign in before connecting to the live server.");
    if (!socket) socket = io(SERVER_URL, {
      autoConnect: false,
      auth: (done) => { void getAuthToken().then((fresh) => done({ token: fresh })).catch(() => done({})); },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      timeout: 8000,
    });
    const current = socket;
    if (!current.hasListeners("stats")) current.on("stats", (s: LiveStats) => statsListeners.forEach((cb) => cb(s)));
    return new Promise<Socket>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        current.off("connect", ready);
        current.off("connect_error", failed);
        current.off("disconnect", closed);
        if (cancelConnect === closed) cancelConnect = null;
      };
      const ready = () => { cleanup(); resolve(current); };
      const failed = (error: Error) => { cleanup(); reject(error); };
      const closed = () => failed(new Error("Live connection closed."));
      const timer = setTimeout(() => failed(new Error("Couldn't reach the live server.")), 10_000);
      cancelConnect = closed;
      current.once("connect", ready);
      current.once("connect_error", failed);
      current.once("disconnect", closed);
      current.connect();
    });
  });
  connecting = attempt;
  void attempt.finally(() => { if (connecting === attempt) connecting = null; }).catch(() => undefined);
  return attempt;
}

/** Upload the current local profile before joining the real queue. */
export async function syncLiveProfile(profile: Profile, prefs: Prefs): Promise<void> {
  const age = ageFromBirthDate(profile.birthDate)?.range;
  if (!age) throw new Error("A valid adult birth date is required before matching.");
  const { name, gender, country, languages, interests, bio } = profile;
  await liveRest("/profile", { method: "POST", body: JSON.stringify({ name, gender, country, languages, interests, bio, age, conversationTypes: prefs.conversationTypes }) });
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
    signal: init.signal ?? AbortSignal.timeout(10_000),
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
  return liveRest<{ connections: ServerConnection[] }>("/connections").then((body) => body.connections);
}
