import { useEffect, useMemo, useRef, useState } from "react";
import { CONVERSATION_TYPES, INTERESTS, MATCH_LEVELS, interestById } from "../data";
import { randomQueuePersonas } from "../engine";
import { useStore } from "../store";
import { LIVE_ENABLED } from "../config";
import { getLiveSocket, onLiveStats } from "../live";
import type { LiveStats, Persona, Prefs } from "../types";
import { Avatar, Icon, OnlinePill, Reveal, Squiggle } from "../components/ui";
import PrefsEditor from "../components/PrefsEditor";

interface QueueRow {
  persona: Persona;
  secs: number;
}

export default function Home() {
  const { profile, prefs, setPrefs, blocked, setFlow, setView, stats, toast } = useStore();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draft, setDraft] = useState<Prefs>(prefs);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  /* real queue presence when the live server is configured */
  useEffect(() => {
    if (!LIVE_ENABLED) return;
    const off = onLiveStats(setLiveStats);
    void getLiveSocket();
    return off;
  }, []);

  /* ---------- live world simulation ---------- */
  const [rows, setRows] = useState<QueueRow[]>(() =>
    randomQueuePersonas(blocked.map((b) => b.personaId), 5).map((p) => ({ persona: p, secs: Math.floor(Math.random() * 40) + 3 }))
  );
  const [online, setOnline] = useState(1287);
  const [matchesToday, setMatchesToday] = useState(48213);
  const tickRef = useRef(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      tickRef.current += 1;
      setRows((prev) => prev.map((r) => ({ ...r, secs: r.secs + 1 })));
      setOnline((o) => Math.max(900, Math.min(2400, o + Math.floor(Math.random() * 41) - 20)));
      if (tickRef.current % 3 === 0) setMatchesToday((m) => m + Math.floor(Math.random() * 4) + 1);
      // rotate one row every ~6s
      if (tickRef.current % 6 === 0) {
        setRows((prev) => {
          const next = [...prev];
          const idx = Math.floor(Math.random() * next.length);
          const candidates = randomQueuePersonas(blocked.map((b) => b.personaId), 8);
          const fresh = candidates.find((c) => !next.some((r) => r.persona.id === c.id));
          if (fresh) next[idx] = { persona: fresh, secs: 2 };
          return next;
        });
      }
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queueCount = useMemo(() => Math.round(online * 0.07), [online]);

  const startSearch = () => {
    if (prefs.agePref.length === 0) {
      toast("Add at least one age range in preferences first.", "warn");
      setPrefsOpen(true);
      return;
    }
    setFlow({ stage: "searching" });
  };

  const prefSummary = useMemo(() => {
    const bits: string[] = [];
    bits.push(prefs.genderPref === "anyone" ? "Anyone" : prefs.genderPref === "other" ? "Other genders" : prefs.genderPref[0].toUpperCase() + prefs.genderPref.slice(1));
    if (prefs.agePref.length === 4) bits.push("All ages 18+");
    else bits.push(prefs.agePref.join(" · "));
    bits.push(prefs.languages.slice(0, 2).join(", ") + (prefs.languages.length > 2 ? ` +${prefs.languages.length - 2}` : ""));
    return bits;
  }, [prefs]);

  return (
    <div className="relative">
      {/* ================= MAIN CONSOLE ================= */}
      <section className="max-w-6xl mx-auto px-5 pt-10 pb-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        {/* left : the pitch + CTA */}
        <div>
          <p className="mono-label text-coral mb-4 animate-rise">Meet someone new</p>
          <h1 className="display text-[clamp(2.7rem,6.2vw,4.8rem)] leading-[0.97] tracking-tight animate-rise" style={{ animationDelay: "0.05s" }}>
            A stranger,
            <br />
            minus the
            <br />
            <span className="relative inline-block text-coral">
              awkward part.
              <Squiggle className="absolute -bottom-2.5 left-0 w-full h-3.5" color="var(--color-amber)" />
            </span>
          </h1>
          <p className="text-lg text-fern font-medium max-w-lg mt-6 animate-rise" style={{ animationDelay: "0.12s" }}>
            We drop you into a text chat with a random person who shares your interests. Instant conversation starters included — zero cold opens.
          </p>

          {/* prefs summary */}
          <div className="card p-5 mt-8 max-w-lg animate-rise" style={{ animationDelay: "0.18s" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="mono-label text-fern">Your radar is set to</p>
              <button className="text-xs font-bold text-coral hover:underline flex items-center gap-1" onClick={() => { setDraft(prefs); setPrefsOpen(true); }}>
                <Icon name="pencil" className="w-3.5 h-3.5" /> Change
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(profile?.interests ?? []).slice(0, 6).map((id) => {
                const i = interestById(id);
                return i ? (
                  <span key={id} className="chip chip-static text-[0.8rem] py-1 px-2.5">
                    <span>{i.emoji}</span> {i.label}
                  </span>
                ) : null;
              })}
              {(profile?.interests.length ?? 0) > 6 && <span className="chip chip-static text-[0.8rem] py-1 px-2.5">+{(profile?.interests.length ?? 0) - 6}</span>}
            </div>
            <p className="text-sm font-semibold text-fern">
              {prefSummary.join(" · ")} ·{" "}
              {prefs.conversationTypes.slice(0, 2).map((c) => CONVERSATION_TYPES.find((x) => x.id === c)?.label).join(" + ") || "Any mood"}
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4 mt-8 animate-rise" style={{ animationDelay: "0.24s" }}>
            <button onClick={startSearch} className="btn btn-coral text-[1.35rem] px-10 py-5" style={{ borderRadius: 18 }}>
              <Icon name="radar" className="w-6 h-6" />
              FIND SOMEONE
            </button>
            <div className="flex flex-col gap-1.5 text-sm">
              <button onClick={() => setView("connections")} className="font-bold hover:text-coral transition-colors flex items-center gap-1.5 text-left">
                <Icon name="heart-fill" className="w-4 h-4 text-coral" /> My connections
                <span className="font-mono text-xs bg-ink text-paper rounded-full px-2 py-0.5">{stats.connects}</span>
              </button>
              <button onClick={() => setView("settings")} className="font-bold text-fern hover:text-ink transition-colors flex items-center gap-1.5 text-left">
                <Icon name="gear" className="w-4 h-4" /> Settings & safety
              </button>
            </div>
          </div>

          <p className="mt-5 text-xs font-semibold text-moss animate-rise" style={{ animationDelay: "0.3s" }}>
            Median time to match right now: <span className="text-teal font-mono">3.8s</span> · Anonymous · 18+ · Report & block in one tap
          </p>
        </div>

        {/* right : live queue board */}
        <Reveal className="lg:mt-4">
          <div className="card card-ink overflow-hidden">
            <div className="bg-ink text-paper px-5 py-3.5 flex items-center justify-between">
              <span className="flex items-center gap-2.5 font-bold text-sm">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-mint animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-mint" />
                </span>
                {LIVE_ENABLED ? "LIVE — searching right now" : "DEMO QUEUE — simulated"}
              </span>
              <span className="font-mono text-xs text-paper/70">{LIVE_ENABLED && liveStats ? `${liveStats.searching} in queue` : `${queueCount} in queue`}</span>
            </div>

            <div className="divide-y divide-ink/8">
              {LIVE_ENABLED ? (
                <div className="px-5 py-7 text-center">
                  <p className="font-bold text-sm mb-1.5">
                    {liveStats
                      ? `${liveStats.online.toLocaleString()} online · ${liveStats.searching} searching · ${liveStats.activeChats} chats active`
                      : "Connecting to the live server…"}
                  </p>
                  <p className="text-xs font-semibold text-fern">Matches come from the real queue — hit FIND SOMEONE to join it.</p>
                </div>
              ) : (
              rows.map((r, i) => (
                <div key={r.persona.id} className="flex items-center gap-3.5 px-5 py-3.5">
                  <Avatar name={r.persona.name} color={["#FF4B2E", "#2FBF8F", "#FFC24B", "#5B8DEF", "#E2618E"][i % 5]} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm leading-tight truncate">
                      {r.persona.name} <span className="font-normal">{r.persona.flag}</span>
                      <span className="text-moss font-semibold text-xs ml-1.5">{r.persona.age}</span>
                    </p>
                    <p className="text-xs font-semibold text-fern truncate">
                      {r.persona.interests.slice(0, 3).map((id) => interestById(id)?.emoji).join(" ")}{" "}
                      {r.persona.interests.slice(0, 3).map((id) => interestById(id)?.label).join(" · ")}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-moss whitespace-nowrap">{Math.floor(r.secs / 60)}:{String(r.secs % 60).padStart(2, "0")}</span>
                </div>
              ))
              )}
            </div>

            {/* metrics */}
            <div className="grid grid-cols-3 divide-x divide-ink/8 border-t-2 border-ink/10 bg-parch">
              {[
                { label: "Online", value: (liveStats?.online ?? online).toLocaleString() },
                { label: "Matches today", value: (liveStats?.matchedToday ?? matchesToday).toLocaleString() },
                { label: LIVE_ENABLED ? "In queue" : "Median match", value: LIVE_ENABLED ? String(liveStats?.searching ?? 0) : "3.8s" },
              ].map((m) => (
                <div key={m.label} className="px-4 py-3 text-center">
                  <p className="font-mono text-[1.05rem] font-medium leading-none">{m.value}</p>
                  <p className="mono-label text-moss mt-1.5" style={{ fontSize: "0.58rem" }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* mini match meter */}
          <div className="card mt-5 p-5 flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-butter border-2 border-ink inline-flex items-center justify-center shrink-0">
              <Icon name="bolt" className="w-5.5 h-5.5 text-ink" />
            </span>
            <div>
              <p className="font-bold leading-tight">Matching is scored, not random-random.</p>
              <p className="text-sm font-medium text-fern">Interests, language, age and mood preferences — weighted, then relaxed level by level until someone fits.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="border-y-2 border-ink bg-amber py-3 -rotate-1 scale-[1.01] my-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4">
          {INTERESTS.map((i) => (
            <span key={i.id} className="display text-lg whitespace-nowrap flex items-center gap-6">
              <span>{i.emoji} {i.label}</span>
              <Icon name="wave" className="w-6 h-6 text-ink/40" />
            </span>
          ))}
        </div>
      </div>

      {/* ================= HOW MATCHING WORKS ================= */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
            <div>
              <p className="mono-label text-coral mb-3">Under the hood</p>
              <h2 className="display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">
                Five levels of “someone's out there”.
              </h2>
            </div>
            <p className="text-sm font-semibold text-fern max-w-xs">If a perfect match isn't waiting, we relax one constraint at a time. You'll never sit on “no one found”.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-5 gap-4">
          {MATCH_LEVELS.map((l, i) => (
            <Reveal key={l.level} delay={i * 90}>
              <div className={`card h-full p-5 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-hard ${i === 0 ? "bg-seafoam border-teal/40" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="display text-3xl text-coral">L{l.level}</span>
                  <span className="font-mono text-xs bg-ink text-paper rounded-full px-2.5 py-1">
                    {l.level === 1 ? "+140 max" : l.level === 2 ? "+110" : l.level === 3 ? "+85" : l.level === 4 ? "+60" : "best fit"}
                  </span>
                </div>
                <p className="font-bold mb-1.5">{l.name}</p>
                <p className="text-[0.82rem] font-medium text-fern leading-relaxed">{l.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= SAFETY STRIP ================= */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <Reveal>
          <div className="rounded-2xl border-2 border-ink bg-pine text-paper p-8 md:p-10 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center shadow-hard">
            <span className="w-16 h-16 rounded-2xl bg-mint/20 border-2 border-mint inline-flex items-center justify-center">
              <Icon name="shield" className="w-8 h-8 text-mint" />
            </span>
            <div>
              <h3 className="display text-2xl md:text-3xl mb-2">Stay safe out there.</h3>
              <p className="text-paper/80 font-medium max-w-xl">
                Never share passwords, money details, or your exact address with strangers. Block and report are always one tap away — reports are anonymous and routed to real moderators.
              </p>
            </div>
            <button className="btn btn-mint" onClick={() => setView("settings")}>
              Safety center <Icon name="chevron" className="w-4 h-4" />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ================= PREFS SLIDE-OVER ================= */}
      {prefsOpen && (
        <div className="fixed inset-0 z-[75]">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setPrefsOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-paper border-l-2 border-ink animate-slide-over flex flex-col">
            <header className="flex items-center justify-between px-6 py-5 border-b-2 border-ink/10">
              <div>
                <p className="mono-label text-coral">Radar settings</p>
                <h3 className="display text-2xl">Who should we find?</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setPrefsOpen(false)} aria-label="Close preferences">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <PrefsEditor prefs={draft} onChange={setDraft} />
            </div>
            <footer className="px-6 py-5 border-t-2 border-ink/10 flex gap-3">
              <button
                className="btn flex-1"
                onClick={() => {
                  if (draft.agePref.length === 0 || draft.conversationTypes.length === 0) {
                    toast("Pick at least one age range and one conversation mood.", "warn");
                    return;
                  }
                  setPrefs(draft);
                  setPrefsOpen(false);
                  toast("Preferences saved.", "success");
                }}
              >
                Save
              </button>
              <button
                className="btn btn-coral flex-1"
                onClick={() => {
                  if (draft.agePref.length === 0 || draft.conversationTypes.length === 0) {
                    toast("Pick at least one age range and one conversation mood.", "warn");
                    return;
                  }
                  setPrefs(draft);
                  setPrefsOpen(false);
                  startSearch();
                }}
              >
                Save & find someone
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
