import { useEffect, useMemo, useState } from "react";
import { interestById } from "../data";
import { useStore } from "../store";
import type { Connection } from "../types";
import { Avatar, Icon, Reveal } from "../components/ui";

const ICEBREAKERS = ["Hey! Still thinking about our chat 👋", "You online? Random question for you", "Hi again! How's your week going?"];

const timeAgo = (t: number) => {
  const mins = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export default function Connections() {
  const { connections, removeConnection, toast } = useStore();
  const [onlineSet, setOnlineSet] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [breakerFor, setBreakerFor] = useState<string | null>(null);

  /* simulated presence — some connections drift online/offline */
  useEffect(() => {
    const roll = () => {
      const next = new Set<string>();
      connections.forEach((c) => {
        if (Math.random() < 0.35) next.add(c.id);
      });
      setOnlineSet(next);
    };
    roll();
    const t = window.setInterval(roll, 8000);
    return () => window.clearInterval(t);
  }, [connections]);

  const sorted = useMemo(() => [...connections].sort((a, b) => b.metAt - a.metAt), [connections]);

  const sendIcebreaker = (c: Connection) => {
    const line = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
    setBreakerFor(null);
    toast(`Icebreaker sent to ${c.name}: “${line}”`, "success");
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
          <div>
            <p className="mono-label text-coral mb-3">Your people</p>
            <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)] leading-none">
              My connections
              <span className="align-top font-mono text-base bg-ink text-paper rounded-full px-3 py-1.5 ml-3 inline-block translate-y-1">{connections.length}</span>
            </h1>
          </div>
          <p className="text-sm font-semibold text-fern max-w-xs">
            Mutual matches land here. No feeds, no noise — just the conversations that clicked.
          </p>
        </div>
      </Reveal>

      {sorted.length === 0 ? (
        <Reveal delay={120}>
          <div className="card card-ink p-10 text-center bg-white">
            <span className="w-20 h-20 mx-auto rounded-full bg-blush border-2 border-ink inline-flex items-center justify-center mb-5 animate-bob">
              <Icon name="heart" className="w-9 h-9 text-coral" />
            </span>
            <h2 className="display text-3xl mb-2">No connections yet.</h2>
            <p className="text-fern font-medium max-w-sm mx-auto mb-7">
              When a chat clicks, hit <b className="text-coral">Connect</b>. If they hit it back, they'll show up right here — ready for round two.
            </p>
            <div className="flex justify-center gap-2 flex-wrap text-sm font-semibold text-moss">
              <span className="chip chip-static">💬 chat</span>
              <Icon name="arrow-right" className="w-4 h-4 self-center text-coral" />
              <span className="chip chip-static">❤️ connect</span>
              <Icon name="arrow-right" className="w-4 h-4 self-center text-coral" />
              <span className="chip chip-static bg-butter">🤝 connection</span>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map((c, i) => {
            const isOnline = onlineSet.has(c.id);
            return (
              <Reveal key={c.id} delay={i * 70}>
                <div className="card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-hard relative group">
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="relative">
                      <Avatar name={c.name} color={c.color} size={52} ring />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-colors ${isOnline ? "bg-mint" : "bg-moss/60"}`}
                        title={isOnline ? "Online now" : "Offline"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg leading-tight">
                        {c.name} <span className="font-normal">{c.flag}</span>
                      </p>
                      <p className="text-xs font-semibold text-moss">
                        Met {timeAgo(c.metAt)} · {isOnline ? <span className="text-teal">online now</span> : "offline"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.shared.length > 0
                      ? c.shared.slice(0, 4).map((id) => {
                          const it = interestById(id);
                          return it ? (
                            <span key={id} className="chip chip-static text-xs py-1 px-2.5 bg-butter">
                              {it.emoji} {it.label}
                            </span>
                          ) : null;
                        })
                      : c.interests.slice(0, 3).map((id) => {
                          const it = interestById(id);
                          return it ? (
                            <span key={id} className="chip chip-static text-xs py-1 px-2.5">
                              {it.emoji} {it.label}
                            </span>
                          ) : null;
                        })}
                  </div>

                  <div className="relative flex gap-2">
                    <button className="btn btn-sm flex-1 text-sm" onClick={() => sendIcebreaker(c)}>
                      <Icon name="bubble" className="w-4 h-4 text-coral" /> Send icebreaker
                    </button>
                    <button
                      className="btn btn-sm btn-soft-danger text-sm"
                      onClick={() => (confirmId === c.id ? (removeConnection(c.id), toast(`${c.name} removed from your connections.`, "info"), setConfirmId(null)) : setConfirmId(c.id))}
                      aria-label={`Remove ${c.name}`}
                    >
                      <Icon name="trash" className={`w-4 h-4 ${confirmId === c.id ? "text-ember" : "text-fern"}`} />
                      {confirmId === c.id && <span className="text-ember">Sure?</span>}
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* reconnection note */}
      {sorted.length > 0 && (
        <Reveal delay={200}>
          <p className="flex items-center gap-2.5 text-sm font-semibold text-fern mt-8 justify-center">
            <Icon name="lock" className="w-4.5 h-4.5 text-teal" />
            Connections stay inside StrangrLoop — no emails, numbers, or profiles are ever exchanged.
          </p>
        </Reveal>
      )}
    </div>
  );
}
