import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GUIDELINES, REPORT_REASONS, interestById } from "../data";
import { acceptProbability, greeting, makeReply, replyDelay, startersFor } from "../engine";
import { useStore } from "../store";
import type { ChatMsg, MatchResult } from "../types";
import { Avatar, Confetti, Icon, Modal } from "../components/ui";

let mid = 0;
const msg = (from: ChatMsg["from"], text: string): ChatMsg => ({ id: `m${++mid}`, from, text, at: Date.now() });
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const hasLink = (t: string) => /(https?:\/\/|www\.)|\.com\b|\.in\b|\.net\b/i.test(t);

export default function Chat({ match }: { match: MatchResult }) {
  const { setFlow, blockUser, bumpStats, addConnection, toast, settings, connections, blocked } = useStore();
  const p = match.persona;

  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    msg("system", `You're now chatting with ${p.name}. Be kind — and remember: never share passwords, money info, or your exact address.`),
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [connectState, setConnectState] = useState<"none" | "sent" | "connected">("none");
  const [incoming, setIncoming] = useState(false);
  const [burst, setBurst] = useState(0);
  const [shakeInput, setShakeInput] = useState(0);
  const [safetyDismissed, setSafetyDismissed] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].id);
  const [reportDetails, setReportDetails] = useState("");
  const [reportBlock, setReportBlock] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const countRef = useRef(0);
  const connectAskedRef = useRef(false);
  const incomingAskedRef = useRef(false);
  const alreadyConnected = connections.some((c) => c.personaId === p.id);
  const isBlocked = blocked.some((b) => b.personaId === p.id);

  const starters = useMemo(() => startersFor(match), [match]);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  /* stranger opens the conversation */
  useEffect(() => {
    const delay = 1300 + Math.random() * 700;
    later(() => setTyping(true), delay);
    later(() => {
      setTyping(false);
      setMessages((m) => [...m, msg("them", greeting(match))]);
    }, delay + 1500 + Math.random() * 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* autoscroll */
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const doConnectSuccess = useCallback(
    (theyInitiated: boolean) => {
      setConnectState("connected");
      setIncoming(false);
      setBurst(Date.now());
      bumpStats({ connects: 1 });
      addConnection({
        id: `c-${p.id}`,
        personaId: p.id,
        name: p.name,
        flag: p.flag,
        country: p.country,
        interests: p.interests,
        shared: match.shared,
        metAt: Date.now(),
        color: p.willingness > 0.75 ? "#2FBF8F" : "#FF4B2E",
      });
      later(() => {
        setTyping(true);
        later(() => {
          setTyping(false);
          setMessages((m) => [
            ...m,
            msg("them", theyInitiated ? "okayyy we connected 🎉 this chat is officially a keeper" : "yesss connection accepted! find me in your Connections anytime 👋"),
          ]);
        }, 1400);
      }, 900);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.id]
  );

  const sendConnectRequest = () => {
    if (connectState !== "none" || alreadyConnected) return;
    connectAskedRef.current = true;
    setConnectState("sent");
    setMenuOpen(false);
    toast(`Connect request sent to ${p.name}`, "info");
    later(() => {
      const roll = Math.random();
      if (roll < acceptProbability(p, countRef.current)) {
        doConnectSuccess(false);
        toast(`🎉 ${p.name} connected with you!`, "success");
      } else {
        setConnectState("none");
        toast(`${p.name} hasn't decided yet — keep the conversation going.`, "warn");
      }
    }, 1800 + Math.random() * 1600);
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    if (hasLink(text)) {
      setShakeInput((k) => k + 1);
      toast("For everyone's safety, links can't be sent in chat.", "warn");
      return;
    }
    setInput("");
    setMessages((m) => [...m, msg("me", text)]);
    bumpStats({ messages: 1 });
    countRef.current += 1;

    // typing + reply
    const delay = replyDelay(p, text);
    later(() => setTyping(true), 500);
    later(() => {
      setTyping(false);
      setMessages((m) => [...m, msg("them", makeReply(p, text, countRef.current))]);
    }, 500 + delay);

    // maybe they reach out to connect
    if (!incomingAskedRef.current && connectState === "none" && !alreadyConnected && countRef.current >= 5 && p.willingness >= 0.62 && Math.random() < 0.7) {
      incomingAskedRef.current = true;
      later(() => {
        setIncoming(true);
        if (settings.notifyConnect) toast(`${p.name} wants to connect with you`, "success");
      }, 500 + delay + 1200);
    }
  };

  const next = () => {
    bumpStats({ nexts: 1 });
    setFlow({ stage: "searching" });
  };

  const finishReport = () => {
    bumpStats({ reports: 1 });
    if (reportBlock) blockUser({ personaId: p.id, name: p.name, at: Date.now(), reason: reportReason });
    setReportOpen(false);
    setFlow({ stage: "idle" });
    toast(reportBlock ? "Reported and blocked. Thanks for keeping StrangrLoop safe." : "Report received — it's been routed to our moderators.", "success");
  };

  const finishBlock = () => {
    blockUser({ personaId: p.id, name: p.name, at: Date.now(), reason: "blocked" });
    setBlockOpen(false);
    setFlow({ stage: "idle" });
    toast(`${p.name} blocked. You'll never be matched with them again.`, "info");
  };

  const connected = connectState === "connected" || alreadyConnected;

  return (
    <div className="fixed inset-0 z-[55] bg-parch flex flex-col noise">
      <Confetti burst={burst} />

      {/* ============ header ============ */}
      <header className="bg-paper border-b-2 border-ink px-4 py-3 flex items-center gap-3 shrink-0">
        <button className="btn btn-ghost btn-icon" onClick={() => setFlow({ stage: "idle" })} aria-label="Leave chat">
          <Icon name="chevron" className="w-5 h-5 rotate-180" />
        </button>
        <div className="relative">
          <Avatar name={p.name} color={p.willingness > 0.75 ? "#2FBF8F" : "#FF4B2E"} size={42} />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-mint border-2 border-paper" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight truncate">
            {p.name} <span className="font-normal">{settings.showCountry && p.flag}</span>
            <span className="text-moss font-semibold text-xs ml-1.5">{settings.showAge && p.age}</span>
          </p>
          <p className="text-xs font-semibold text-fern truncate">
            {match.shared.length > 0
              ? match.shared.slice(0, 3).map((id) => `${interestById(id)?.emoji} ${interestById(id)?.label}`).join(" • ")
              : "Exploring new territory together"}
            <span className="text-coral font-mono ml-1.5">{match.pct}% match</span>
          </p>
        </div>

        {!connected && connectState === "none" && (
          <button className="btn btn-coral btn-sm text-sm hidden sm:inline-flex" onClick={sendConnectRequest}>
            <Icon name="heart" className="w-4 h-4" /> Connect
          </button>
        )}
        {connectState === "sent" && (
          <span className="chip chip-static chip-pad bg-butter border-amber text-sm">
            <Icon name="heart" className="w-4 h-4 text-coral animate-pulse-dot" /> Request sent…
          </span>
        )}
        {connected && connectState !== "sent" && (
          <span className="chip chip-static chip-pad bg-seafoam border-mint text-sm text-teal">
            <Icon name="heart-fill" className="w-4 h-4" /> Connected
          </span>
        )}

        {/* menu */}
        <div className="relative">
          <button className="btn btn-icon" onClick={() => setMenuOpen((v) => !v)} aria-label="Chat menu">
            <Icon name="dots" className="w-5 h-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-52 card card-ink overflow-hidden animate-pop">
                {!connected && connectState !== "sent" && (
                  <button className="w-full text-left px-4 py-3 font-bold text-sm hover:bg-butter flex items-center gap-2.5 transition-colors" onClick={sendConnectRequest}>
                    <Icon name="heart" className="w-4.5 h-4.5 text-coral" /> Send connect request
                  </button>
                )}
                <button className="w-full text-left px-4 py-3 font-bold text-sm hover:bg-butter flex items-center gap-2.5 transition-colors" onClick={() => { setSafetyOpen(true); setMenuOpen(false); }}>
                  <Icon name="shield" className="w-4.5 h-4.5 text-teal" /> Safety tips
                </button>
                <button className="w-full text-left px-4 py-3 font-bold text-sm hover:bg-butter flex items-center gap-2.5 transition-colors" onClick={() => { setReportOpen(true); setMenuOpen(false); }}>
                  <Icon name="flag" className="w-4.5 h-4.5 text-amber" /> Report {p.name}
                </button>
                <button className="w-full text-left px-4 py-3 font-bold text-sm hover:bg-blush flex items-center gap-2.5 text-ember border-t border-ink/8 transition-colors" onClick={() => { setBlockOpen(true); setMenuOpen(false); }}>
                  <Icon name="ban" className="w-4.5 h-4.5" /> Block {p.name}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ============ feed ============ */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* shared interests card */}
          {match.shared.length > 0 && (
            <div className="card p-4 mb-2 animate-pop">
              <p className="mono-label text-fern mb-2.5">You both like</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {match.shared.map((id) => {
                  const i = interestById(id);
                  return i ? (
                    <span key={id} className="chip chip-static bg-butter border-ink/25">
                      <span>{i.emoji}</span> {i.label}
                    </span>
                  ) : null;
                })}
              </div>
              <p className="mono-label text-moss mb-2">Icebreakers — tap to send</p>
              <div className="flex flex-wrap gap-1.5">
                {starters.map((s) => (
                  <button key={s} className="chip chip-send" onClick={() => send(s)}>
                    <Icon name="spark" className="w-3.5 h-3.5 text-coral" /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.from === "system" ? (
              <div key={m.id} className="text-center px-6">
                <span className="inline-block text-[0.78rem] font-semibold text-fern bg-ink/6 border border-ink/10 rounded-full px-4 py-2 leading-snug">
                  🛡️ {m.text}
                </span>
              </div>
            ) : (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"} animate-pop`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 border-2 ${
                  m.from === "me"
                    ? "bg-ink text-paper border-ink rounded-br-md"
                    : "bg-white border-ink/12 rounded-bl-md shadow-[3px_3px_0_0_rgba(20,38,31,0.08)]"
                }`}>
                  <p className="text-[0.95rem] font-medium leading-relaxed break-words">{m.text}</p>
                  <p className={`text-[0.62rem] font-mono mt-1 ${m.from === "me" ? "text-paper/50 text-right" : "text-moss"}`}>{fmtTime(m.at)}</p>
                </div>
              </div>
            )
          )}

          {typing && (
            <div className="flex justify-start animate-pop">
              <div className="bg-white border-2 border-ink/12 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-fern typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* incoming connect request */}
          {incoming && !connected && (
            <div className="card card-ink p-4 bg-butter animate-pop max-w-md mx-auto">
              <p className="font-bold flex items-center gap-2 mb-3">
                <Icon name="heart-fill" className="w-5 h-5 text-coral" /> {p.name} wants to connect!
              </p>
              <p className="text-sm font-medium text-fern mb-4">Mutual connects can message each other later from your Connections page. No personal info is shared.</p>
              <div className="flex gap-2">
                <button className="btn btn-mint btn-sm flex-1" onClick={() => doConnectSuccess(true)}>Accept</button>
                <button className="btn btn-sm flex-1" onClick={() => { setIncoming(false); toast("Request dismissed — you can still connect anytime.", "info"); }}>
                  Not now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ safety strip ============ */}
      {!safetyDismissed && (
        <div className="px-4 shrink-0">
          <div className="max-w-2xl mx-auto bg-amber/25 border-2 border-ink/15 rounded-xl px-4 py-2.5 flex items-center gap-3 mb-2">
            <Icon name="shield" className="w-4.5 h-4.5 text-ink shrink-0" />
            <p className="text-[0.78rem] font-semibold flex-1">Stay safe: never share passwords, money details, or your exact address. Block or report anytime.</p>
            <button onClick={() => setSafetyDismissed(true)} className="text-ink/50 hover:text-ink" aria-label="Dismiss safety tip">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============ input bar ============ */}
      <footer className="bg-paper border-t-2 border-ink px-4 py-3.5 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5" key={shakeInput}>
          <div className={`flex-1 ${shakeInput ? "animate-shake" : ""}`}>
            <input
              ref={inputRef}
              className="field"
              placeholder="Type a message…"
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              autoFocus
            />
          </div>
          <button className="btn btn-coral btn-md" onClick={() => send()} aria-label="Send message" disabled={!input.trim()}>
            <Icon name="send" className="w-5 h-5" />
          </button>
          <button className="btn btn-ink btn-md" onClick={next} title="End this chat and find someone new">
            Next <Icon name="arrow-right" className="w-4.5 h-4.5" />
          </button>
        </div>
      </footer>

      {/* ============ report modal ============ */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)}>
        <div className="card card-ink p-6 bg-paper">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="mono-label text-coral">Anonymous report</p>
              <h3 className="display text-2xl">Report {p.name}</h3>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => setReportOpen(false)} aria-label="Close">
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm font-medium text-fern mb-4">
            {p.name} will never know it was you. The conversation ends immediately and the report goes to our moderation team.
          </p>
          <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto pr-1">
            {REPORT_REASONS.map((r) => (
              <label key={r.id} className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 cursor-pointer transition-colors ${reportReason === r.id ? "border-ink bg-butter" : "border-ink/12 bg-white hover:border-ink/40"}`}>
                <input type="radio" name="reason" className="sr-only" checked={reportReason === r.id} onChange={() => setReportReason(r.id)} />
                <span className={`w-4.5 h-4.5 rounded-full border-2 border-ink inline-flex items-center justify-center shrink-0 ${reportReason === r.id ? "bg-coral" : "bg-white"}`}>
                  {reportReason === r.id && <span className="w-1.5 h-1.5 rounded-full bg-paper" />}
                </span>
                <span className="text-sm font-bold">{r.label}</span>
              </label>
            ))}
          </div>
          <textarea className="field mb-3" rows={2} placeholder="Anything else that helps our moderators (optional)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
          <label className="flex items-center gap-2.5 cursor-pointer select-none mb-5">
            <button
              onClick={() => setReportBlock((v) => !v)}
              className={`w-6 h-6 rounded-md border-2 border-ink inline-flex items-center justify-center ${reportBlock ? "bg-coral text-paper" : "bg-white"}`}
              aria-pressed={reportBlock}
            >
              {reportBlock && <Icon name="check" className="w-4 h-4" />}
            </button>
            <span className="text-sm font-semibold" onClick={() => setReportBlock((v) => !v)}>Also block {p.name} — they'll never match me again</span>
          </label>
          <button className="btn btn-coral btn-md w-full" onClick={finishReport}>
            <Icon name="flag" className="w-4.5 h-4.5" /> Submit report & end chat
          </button>
        </div>
      </Modal>

      {/* ============ block modal ============ */}
      <Modal open={blockOpen} onClose={() => setBlockOpen(false)}>
        <div className="card card-ink p-6 bg-paper text-center">
          <span className="w-14 h-14 mx-auto rounded-full bg-blush border-2 border-ink inline-flex items-center justify-center mb-4">
            <Icon name="ban" className="w-7 h-7 text-ember" />
          </span>
          <h3 className="display text-2xl mb-2">Block {p.name}?</h3>
          <p className="text-sm font-medium text-fern mb-5">The conversation ends right now and they'll never appear in your matches again. You can unblock later in Settings.</p>
          <div className="flex gap-3">
            <button className="btn flex-1" onClick={() => setBlockOpen(false)}>Keep chatting</button>
            <button className="btn btn-coral flex-1" onClick={finishBlock}>
              <Icon name="ban" className="w-4.5 h-4.5" /> Block & end
            </button>
          </div>
        </div>
      </Modal>

      {/* ============ safety modal ============ */}
      <Modal open={safetyOpen} onClose={() => setSafetyOpen(false)}>
        <div className="card card-ink p-6 bg-paper">
          <div className="flex items-start justify-between mb-4">
            <h3 className="display text-2xl flex items-center gap-2.5">
              <Icon name="shield" className="w-6 h-6 text-teal" /> Stay safe
            </h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setSafetyOpen(false)} aria-label="Close">
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2.5">
            {GUIDELINES.slice(2, 6).map((g, i) => (
              <li key={i} className="flex gap-2.5 text-sm font-medium text-fern">
                <Icon name="check" className="w-4.5 h-4.5 text-mint shrink-0 mt-0.5" /> {g}
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-moss mt-5">Reports are anonymous and reviewed by real moderators — severe cases are escalated immediately.</p>
        </div>
      </Modal>
    </div>
  );
}
