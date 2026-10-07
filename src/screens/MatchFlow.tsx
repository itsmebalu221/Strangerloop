import { useEffect, useMemo, useRef, useState } from "react";
import { SEARCH_STAGES, interestById } from "../data";
import { pickStranger, queueCandidates, searchDuration } from "../engine";
import { LIVE_ENABLED } from "../config";
import { getLiveSocket, liveSocket } from "../live";
import { useStore } from "../store";
import type { LiveMatch, MatchResult } from "../types";
import { Avatar, Icon } from "../components/ui";

/* ================= SEARCHING ================= */
export function Searching() {
  const { profile, prefs, blocked, setFlow, bumpStats, toast } = useStore();
  const [stageIdx, setStageIdx] = useState(0);
  const startedRef = useRef(false);

  const candidates = useMemo(
    () => (profile ? queueCandidates(profile, prefs, blocked.map((b) => b.personaId), 6) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (startedRef.current || !profile) return;
    startedRef.current = true;
    bumpStats({ chats: 1 });

    const stageTimer = window.setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, SEARCH_STAGES.length - 1));
    }, 950);

    /* live mode — join the server queue; a real match arrives over the socket */
    if (LIVE_ENABLED) {
      let cancelled = false;
      const onFound = (m: LiveMatch) => {
        if (!cancelled) setFlow({ stage: "chat", live: m });
      };
      const onError = (e: { message?: string }) => {
        if (!cancelled) {
          toast(e.message ?? "Couldn't join the matching queue.", "warn");
          setFlow({ stage: "idle" });
        }
      };
      void getLiveSocket()
        .then((s) => {
          if (cancelled) return;
          s.on("match:found", onFound);
          s.on("queue:error", onError);
          s.emit("queue:join", { prefs });
        })
        .catch(() => {
          if (!cancelled) {
            toast("Couldn't reach the live server.", "warn");
            setFlow({ stage: "idle" });
          }
        });
      return () => {
        cancelled = true;
        window.clearInterval(stageTimer);
        const s = liveSocket();
        if (s) {
          s.off("match:found", onFound);
          s.off("queue:error", onError);
          s.emit("queue:leave");
        }
      };
    }

    /* simulation mode */
    const matchTimer = window.setTimeout(() => {
      const match = pickStranger(profile, prefs, blocked.map((b) => b.personaId));
      if (!match) {
        toast("You've blocked everyone in the pool — unblock a few in Settings to keep matching.", "warn");
        setFlow({ stage: "idle" });
        return;
      }
      setFlow({ stage: "intro", match });
    }, searchDuration());

    return () => {
      window.clearInterval(stageTimer);
      window.clearTimeout(matchTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-paper noise overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-50" />
      <div className="relative h-full max-w-3xl mx-auto px-5 flex flex-col items-center justify-center text-center">
        {/* radar */}
        <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] mb-10">
          {[1, 0.72, 0.44].map((s) => (
            <span key={s} className="absolute rounded-full border-2 border-ink/10" style={{ inset: `${(1 - s) * 50}%` }} />
          ))}
          <span className="absolute inset-0 rounded-full border-2 border-ink/15" />
          <span className="absolute inset-[14%] rounded-full border border-ink/10" />
          <span className="absolute inset-[28%] rounded-full border border-ink/10" />
          {/* sweep */}
          <span className="absolute inset-0 rounded-full animate-sweep" style={{ background: "conic-gradient(from 0deg, rgba(255,75,46,0.22), transparent 65deg)" }} />
          {/* center you */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-coral border-2 border-ink shadow-hard-sm inline-flex items-center justify-center text-paper">
            <Icon name="radar" className="w-7 h-7" />
          </span>
          {/* candidate blips */}
          {candidates.slice(0, 5).map((c, i) => {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const radius = 42 - (i % 2) * 7;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            return (
              <span
                key={c.persona.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-ink rounded-full shadow-hard-sm px-2.5 py-1 text-[0.7rem] font-bold whitespace-nowrap animate-pop"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${0.3 + i * 0.25}s` }}
              >
                {c.persona.interests.slice(0, 2).map((id) => interestById(id)?.emoji).join(" ")} {c.persona.name}
              </span>
            );
          })}
        </div>

        <p className="display text-[clamp(2rem,5vw,3.4rem)] leading-none mb-4">
          Finding someone<span className="animate-caret text-coral">…</span>
        </p>
        <p key={stageIdx} className="mono-label text-fern">{SEARCH_STAGES[stageIdx]}</p>
        <p className="text-sm font-semibold text-moss mt-3">Usually takes 2–5 seconds when the queue is warm.</p>

        <button
          className="btn mt-9"
          onClick={() => {
            setFlow({ stage: "idle" });
          }}
        >
          <Icon name="x" className="w-4 h-4" /> Cancel search
        </button>
      </div>
    </div>
  );
}

/* ================= INTRO : YOU'RE CONNECTED ================= */
export function MatchIntro({ match }: { match: MatchResult }) {
  const { setFlow, settings } = useStore();
  const [progress, setProgress] = useState(0);
  const p = match.persona;
  const title = "You're connected!";

  useEffect(() => {
    const t = window.setInterval(() => {
      setProgress((v) => {
        if (v >= 100) {
          window.clearInterval(t);
          setFlow({ stage: "chat", match });
          return 100;
        }
        return v + 4;
      });
    }, 90);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-pine noise overflow-hidden flex items-center justify-center px-5">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(244,246,239,0.25) 1.1px, transparent 1.1px)", backgroundSize: "26px 26px" }} />
      {/* quiet corner rings */}
      <span className="absolute -top-24 -left-24 w-72 h-72 rounded-full border-2 border-mint/20" />
      <span className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full border-2 border-coral/25" />

      <div className="relative text-center max-w-lg w-full">
        <h1 className="display text-[clamp(2.6rem,7vw,4.6rem)] text-paper leading-none mb-8">{title}</h1>

        <div className="bg-paper border-2 border-ink rounded-2xl shadow-hard p-6 text-left animate-pop" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={p.name} color={p.willingness > 0.75 ? "#2FBF8F" : "#FF4B2E"} size={62} ring />
            <div className="flex-1 min-w-0">
              <p className="display text-2xl leading-none">{p.name}</p>
              <p className="text-sm font-semibold text-fern mt-1.5">
                {settings.showCountry && <span>{p.flag} {p.country}</span>}
                {settings.showCountry && settings.showAge && <span className="text-moss"> · </span>}
                {settings.showAge && <span>{p.age}</span>}
                {!settings.showCountry && !settings.showAge && <span>Matched by shared interests</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="display text-2xl text-coral leading-none">{match.pct}%</p>
              <p className="mono-label text-moss" style={{ fontSize: "0.55rem" }}>match</p>
            </div>
          </div>

          {match.shared.length > 0 ? (
            <>
              <p className="mono-label text-fern mb-2">You both like</p>
              <div className="flex flex-wrap gap-1.5">
                {match.shared.map((id) => {
                  const i = interestById(id);
                  return i ? (
                    <span key={id} className="chip chip-static bg-butter border-ink/30">
                      <span>{i.emoji}</span> {i.label}
                    </span>
                  ) : null;
                })}
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-fern">Different interests today — a chance to learn something new. {match.sharedLang ? `You share ${match.sharedLang}.` : ""}</p>
          )}

          {/* auto-open progress */}
          <div className="mt-5">
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div className="h-full bg-coral rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs font-semibold text-moss mt-2">Opening chat automatically…</p>
          </div>
        </div>

        <button className="btn btn-coral mt-7 text-lg px-9 py-4" onClick={() => setFlow({ stage: "chat", match })}>
          <Icon name="bubble" className="w-5 h-5" /> Say hi now
        </button>
      </div>
    </div>
  );
}
