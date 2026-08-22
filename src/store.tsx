import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, BlockedUser, Connection, Flow, Prefs, Profile, SessionStats, Toast, UserSettings, View } from "./types";
import { getCurrentUser, onAuthChange, signOutUser } from "./auth";

const LS_KEY = "strangrloop:v1";

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

function load(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      return {
        profile: p.profile ?? null,
        prefs: { ...DEFAULT_PREFS, ...p.prefs },
        connections: p.connections ?? [],
        blocked: p.blocked ?? [],
        stats: { ...DEFAULT_STATS, ...p.stats },
        settings: { ...DEFAULT_SETTINGS, ...p.settings },
      };
    }
  } catch {
    /* corrupted storage — start fresh */
  }
  return {
    profile: null,
    prefs: DEFAULT_PREFS,
    connections: [],
    blocked: [],
    stats: DEFAULT_STATS,
    settings: DEFAULT_SETTINGS,
  };
}

interface Store extends Persisted {
  view: View;
  flow: Flow;
  toasts: Toast[];
  authUser: AuthUser | null;
  authReady: boolean;
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
  const initial = useMemo(load, []);
  const [profile, setProfile] = useState(initial.profile);
  const [prefs, setPrefsState] = useState(initial.prefs);
  const [connections, setConnections] = useState(initial.connections);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [stats, setStats] = useState(initial.stats);
  const [settings, setSettingsState] = useState(initial.settings);
  const [view, setView] = useState<View>("home");
  const [flow, setFlow] = useState<Flow>({ stage: "idle" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

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

  const signOut = useCallback(async () => {
    await signOutUser();
    setFlow({ stage: "idle" });
    setView("home");
  }, []);

  // persist
  useEffect(() => {
    const data: Persisted = { profile, prefs, connections, blocked, stats, settings };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* storage full / private mode — non-fatal */
    }
  }, [profile, prefs, connections, blocked, stats, settings]);

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

  const value: Store = {
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
      localStorage.removeItem(LS_KEY);
      setProfile(null);
      setPrefsState(DEFAULT_PREFS);
      setConnections([]);
      setBlocked([]);
      setStats(DEFAULT_STATS);
      setSettingsState(DEFAULT_SETTINGS);
      setFlow({ stage: "idle" });
      setView("home");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
