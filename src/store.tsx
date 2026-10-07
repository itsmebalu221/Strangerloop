import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, BlockedUser, Connection, Flow, Prefs, Profile, SessionStats, Toast, UserSettings, View } from "./types";
import { getCurrentUser, onAuthChange, signOutUser } from "./auth";
import { closeLiveSocket } from "./live";

/** Per-user persistence — accounts on the same browser never share data. */
const LS_PREFIX = "strangrloop:v2:";
const LEGACY_KEY = "strangrloop:v1";

interface Persisted {
  profile: Profile | null;
  prefs: Prefs;
  connections: Connection[];
  blocked: BlockedUser[];
  stats: SessionStats;
  settings: UserSettings;
}

const DEFAULT_PREFS: Prefs = {
  genderPref: "anyone",
  agePref: ["18–24", "25–34", "35–44", "45+"],
  languages: ["English"],
  conversationTypes: ["casual"],
};

const DEFAULT_SETTINGS: UserSettings = {
  notifyConnect: true,
  showCountry: true,
  showAge: true,
};

const DEFAULT_STATS: SessionStats = { chats: 0, nexts: 0, connects: 0, reports: 0, messages: 0 };

const DEFAULTS: Persisted = {
  profile: null,
  prefs: DEFAULT_PREFS,
  connections: [],
  blocked: [],
  stats: DEFAULT_STATS,
  settings: DEFAULT_SETTINGS,
};

function parseBlob(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      profile: p.profile ?? null,
      prefs: { ...DEFAULT_PREFS, ...p.prefs },
      connections: Array.isArray(p.connections) ? p.connections : [],
      blocked: Array.isArray(p.blocked) ? p.blocked : [],
      stats: { ...DEFAULT_STATS, ...p.stats },
      settings: { ...DEFAULT_SETTINGS, ...p.settings },
    };
  } catch {
    return null;
  }
}

function loadFor(userId: string | null): Persisted {
  if (!userId) return DEFAULTS;
  const scoped = parseBlob(localStorage.getItem(LS_PREFIX + userId));
  if (scoped) return scoped;
  // one-time migration from the pre-v2 shared key
  const legacy = parseBlob(localStorage.getItem(LEGACY_KEY));
  if (legacy) {
    try {
      localStorage.setItem(LS_PREFIX + userId, JSON.stringify(legacy));
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* storage full / private mode — non-fatal */
    }
    return legacy;
  }
  return DEFAULTS;
}

function persist(userId: string | null, data: Persisted): void {
  if (!userId) return;
  try {
    localStorage.setItem(LS_PREFIX + userId, JSON.stringify(data));
  } catch {
    /* storage full / private mode — non-fatal */
  }
}

interface Store extends Persisted {
  view: View;
  flow: Flow;
  toasts: Toast[];
  authUser: AuthUser | null;
  authReady: boolean;
  hydrated: boolean;
  signOut: () => Promise<void>;
  setView: (v: View) => void;
  setFlow: (f: Flow) => void;
  saveProfile: (p: Profile) => void;
  setPrefs: (p: Prefs) => void;
  addConnection: (c: Connection) => void;
  removeConnection: (id: string) => void;
  blockUser: (b: BlockedUser) => void;
  unblockUser: (personaId: string) => void;
  bumpStats: (patch: Partial<SessionStats>) => void;
  setSettings: (s: Partial<UserSettings>) => void;
  toast: (text: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
  resetAccount: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [stats, setStats] = useState<SessionStats>(DEFAULT_STATS);
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<View>("home");
  const [flow, setFlow] = useState<Flow>({ stage: "idle" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // subscribe to the auth layer (Supabase or demo) exactly once
  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then((u) => {
        if (alive) {
          setAuthUser(u);
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (alive) setAuthReady(true);
      });
    const unsub = onAuthChange((u) => {
      if (!alive) return;
      setAuthUser(u);
      setAuthReady(true);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // hydrate persisted state per signed-in user (re-runs on account switch)
  useEffect(() => {
    if (!authReady) return;
    const data = loadFor(authUser?.id ?? null);
    setProfile(data.profile);
    setPrefsState(data.prefs);
    setConnections(data.connections);
    setBlocked(data.blocked);
    setStats(data.stats);
    setSettingsState(data.settings);
    setFlow({ stage: "idle" });
    setView("home");
    setHydrated(true);
  }, [authReady, authUser?.id]);

  const signOut = useCallback(async () => {
    await signOutUser();
    closeLiveSocket();
    setFlow({ stage: "idle" });
    setView("home");
  }, []);

  // persist (scoped to the signed-in user)
  const uidRef = useRef<string | null>(null);
  uidRef.current = authUser?.id ?? null;
  useEffect(() => {
    if (!authUser || !hydrated) return;
    persist(
      authUser.id,
      { profile, prefs, connections, blocked, stats, settings }
    );
  }, [authUser, hydrated, profile, prefs, connections, blocked, stats, settings]);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const value: Store = useMemo(
    () => ({
      profile,
      prefs,
      connections,
      blocked,
      stats,
      settings,
      view,
      flow,
      toasts,
      authUser,
      authReady,
      hydrated,
      signOut,
      setView,
      setFlow,
      saveProfile: setProfile,
      setPrefs: setPrefsState,
      addConnection: (c) => setConnections((prev) => (prev.some((x) => x.id === c.id) ? prev : [c, ...prev])),
      removeConnection: (id) => setConnections((prev) => prev.filter((x) => x.id !== id)),
      blockUser: (b) => setBlocked((prev) => (prev.some((x) => x.personaId === b.personaId) ? prev : [b, ...prev])),
      unblockUser: (pid) => setBlocked((prev) => prev.filter((x) => x.personaId !== pid)),
      bumpStats: (patch) =>
        setStats((s) => {
          const next = { ...s };
          (Object.keys(patch) as (keyof SessionStats)[]).forEach((k) => {
            next[k] = s[k] + (patch[k] ?? 0);
          });
          return next;
        }),
      setSettings: (s) => setSettingsState((prev) => ({ ...prev, ...s })),
      toast,
      dismissToast,
      resetAccount: () => {
        const uid = uidRef.current;
        if (uid) localStorage.removeItem(LS_PREFIX + uid);
        localStorage.removeItem(LEGACY_KEY);
        setProfile(null);
        setPrefsState(DEFAULT_PREFS);
        setConnections([]);
        setBlocked([]);
        setStats(DEFAULT_STATS);
        setSettingsState(DEFAULT_SETTINGS);
        setFlow({ stage: "idle" });
        setView("home");
      },
    }),
    [profile, prefs, connections, blocked, stats, settings, view, flow, toasts, authUser, authReady, hydrated, signOut, toast, dismissToast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
