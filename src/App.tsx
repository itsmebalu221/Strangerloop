import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { LIVE_ENABLED } from "./config";
import { getLiveSocket, onLiveStats } from "./live";
import type { LiveStats, View } from "./types";
import { AUTH_MODE } from "./config";
import { Icon, Logo, LogoMark, OnlinePill, ToastHost } from "./components/ui";
import type { IconName } from "./components/ui";
import AuthScreen from "./screens/Auth";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Connections from "./screens/Connections";
import Profile from "./screens/Profile";
import Settings from "./screens/Settings";
import { MatchIntro, Searching } from "./screens/MatchFlow";
import Chat from "./screens/Chat";

const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "connections", label: "Connections", icon: "heart" },
  { id: "profile", label: "Profile", icon: "user" },
  { id: "settings", label: "Settings", icon: "gear" },
];

function Shell() {
  const { profile, flow, view, setView, connections, stats, authUser, authReady } = useStore();
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    if (!LIVE_ENABLED) return;
    const off = onLiveStats(setLiveStats);
    void getLiveSocket();
    return off;
  }, []);

  if (!authReady) return <Boot />;
  if (!authUser) return <AuthScreen />;
  if (!profile) return <Onboarding />;

  const inChatFlow = flow.stage !== "idle";

  return (
    <div className="min-h-screen noise flex flex-col">
      <div className="fixed inset-0 bg-dots opacity-50 pointer-events-none" />

      {/* ================= nav ================= */}
      <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-sm border-b-2 border-ink/10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-3">
          <button onClick={() => { setView("home"); if (!inChatFlow) window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="StrangrLoop home">
            <Logo />
          </button>
          <nav className="ml-auto flex items-center gap-1" aria-label="Primary">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  view === n.id ? "bg-ink text-paper shadow-hard-sm -translate-y-0.5" : "text-fern hover:text-ink hover:bg-ink/6"
                }`}
              >
                <Icon name={n.icon} className="w-4.5 h-4.5" />
                <span className="hidden md:inline">{n.label}</span>
                {n.id === "connections" && connections.length > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[0.65rem] font-mono inline-flex items-center justify-center border-2 border-ink ${view === n.id ? "bg-coral text-paper" : "bg-amber text-ink"}`}>
                    {connections.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="hidden sm:block">
            <OnlinePill count={liveStats ? liveStats.online : 1287 + Math.round(Math.sin(stats.chats) * 40)} />
          </div>
        </div>
      </header>

      {/* ================= main ================= */}
      <main className="relative flex-1">
        {view === "home" && <Home />}
        {view === "connections" && <Connections />}
        {view === "profile" && <Profile />}
        {view === "settings" && <Settings />}
      </main>

      {/* ================= footer ================= */}
      <footer className="relative border-t-2 border-ink/10 bg-parch">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Logo compact />
          <span className="display text-lg">Strangr<span className="text-coral">Loop</span></span>
          <p className="text-sm font-semibold text-fern">Meet interesting people who share your interests.</p>
          <div className="ml-auto flex items-center gap-2">
            <span className="chip chip-static text-xs">18+ only</span>
            <span className="chip chip-static text-xs">🛡️ moderated</span>
            <span className={`chip chip-static text-xs ${AUTH_MODE === "supabase" ? "bg-seafoam border-mint text-teal" : "bg-butter border-amber"}`}>
              {AUTH_MODE === "supabase" ? "live auth" : "demo auth"}
            </span>
          </div>
        </div>
        <p className="text-center text-[0.7rem] font-mono text-moss pb-5">
          demo build — stranger conversations are simulated locally · random chat → connections → groups → communities → forum
        </p>
      </footer>

      {/* ================= flow overlays ================= */}
      {flow.stage === "searching" && <Searching />}
      {flow.stage === "intro" && <MatchIntro match={flow.match} />}
      {flow.stage === "chat" && "match" in flow && <Chat key={`${flow.match.persona.id}-${stats.chats}`} match={flow.match} />}
      {flow.stage === "chat" && "live" in flow && <Chat key={flow.live.sessionId} live={flow.live} />}
    </div>
  );
}

function Boot() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 noise relative">
      <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />
      <div className="relative">
        <LogoMark size={68} />
      </div>
      <div className="relative text-center">
        <p className="display text-3xl leading-none">
          Strangr<span className="text-coral">Loop</span>
        </p>
        <p className="mono-label text-moss mt-3 animate-pulse">warming up the loop…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
      <ToastHost />
    </StoreProvider>
  );
}
