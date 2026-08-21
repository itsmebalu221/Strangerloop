import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useStore } from "../store";

/* ================= custom SVG icons ================= */
export type IconName =
  | "radar" | "arrow-right" | "send" | "heart" | "heart-fill" | "shield" | "flag" | "ban"
  | "users" | "user" | "x" | "check" | "chevron" | "spark" | "globe" | "bubble" | "pencil"
  | "trash" | "info" | "alert" | "dots" | "gear" | "home" | "link-off" | "wave" | "bolt" | "lock";

const PATHS: Record<IconName, ReactNode> = {
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 L18.5 5.8" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  "arrow-right": <path d="M4 12h15m0 0-6-6m6 6-6 6" />,
  send: <path d="M4.5 11.5 19.5 4.8l-4.4 14.7c-.3 1-1.6 1.1-2 .1l-2.3-4.9-5-2.2c-1-.4-.9-1.7.1-2Zm0 0L12.8 14" />,
  heart: <path d="M12 20s-7.5-4.6-9-9.2C2 7.7 4 5 6.8 5c2 0 3.6 1.1 4.5 2.7.4.7 1 .7 1.4 0C13.6 6.1 15.2 5 17.2 5 20 5 22 7.7 21 10.8c-1.5 4.6-9 9.2-9 9.2Z" />,
  "heart-fill": <path d="M12 20s-7.5-4.6-9-9.2C2 7.7 4 5 6.8 5c2 0 3.6 1.1 4.5 2.7.4.7 1 .7 1.4 0C13.6 6.1 15.2 5 17.2 5 20 5 22 7.7 21 10.8c-1.5 4.6-9 9.2-9 9.2Z" fill="currentColor" />,
  shield: (
    <>
      <path d="M12 3.2 5 6v5.4c0 4.4 2.9 7.7 7 9.4 4.1-1.7 7-5 7-9.4V6l-7-2.8Z" />
      <path d="m9 11.8 2.2 2.2L15.4 9.6" />
    </>
  ),
  flag: <path d="M6 21V4m0 1h11l-2.5 3.5L17 12H6" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6.5 18 17.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15.5 5.8a3.2 3.2 0 0 1 0 5.4M17.5 14.9c1.7.7 2.7 2.3 3 4.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5.5 20c.7-3.7 3.3-5.7 6.5-5.7s5.8 2 6.5 5.7" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  spark: <path d="M12 3.5c.6 4.4 2 6.4 6.5 8.5-4.5 2.1-5.9 4.1-6.5 8.5-.6-4.4-2-6.4-6.5-8.5 4.5-2.1 5.9-4.1 6.5-8.5Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.1-3.9-8.5s1.3-6.2 3.9-8.5Z" />
    </>
  ),
  bubble: <path d="M4 6.5C4 5.1 5.1 4 6.5 4h11C18.9 4 20 5.1 20 6.5v8c0 1.4-1.1 2.5-2.5 2.5H12l-4.5 3.5V17h-1C5.1 17 4 15.9 4 14.5v-8Z" />,
  pencil: <path d="m14.5 5 4.5 4.5L8.5 20H4v-4.5L14.5 5Zm2-2 2-2 4.5 4.5-2 2" />,
  trash: <path d="M5 7h14M9.5 7V4.8h5V7M7 7l1 13h8l1-13M10.2 11v5.5M13.8 11v5.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2" />
      <circle cx="12" cy="7.8" r="0.5" fill="currentColor" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.8 2.8 19.5h18.4L12 3.8Z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="16.8" r="0.5" fill="currentColor" />
    </>
  ),
  dots: (
    <>
      <circle cx="12" cy="5.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.3m0 12.4v2.3M3.5 12h2.3m12.4 0h2.3M6 6l1.6 1.6m8.8 8.8L18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </>
  ),
  home: <path d="m4 11 8-7 8 7v8.5a1 1 0 0 1-1 1h-4.5V15h-5v5.5H5a1 1 0 0 1-1-1V11Z" />,
  "link-off": (
    <>
      <path d="M10 14a4 4 0 0 0 6 .5l2.5-2.5a4 4 0 0 0-5.7-5.7L11.5 7.7" />
      <path d="M14 10a4 4 0 0 0-6-.5L5.5 12a4 4 0 0 0 5.7 5.7l1.3-1.4" />
      <path d="m4 4 16 16" />
    </>
  ),
  wave: <path d="M2.5 14.5c2.4-7 4.8-7 7.2 0s4.8 7 7.2 0 3.4-5 4.6-3.5" />,
  bolt: <path d="M13 3 5 13.5h5L11 21l8-10.5h-5L13 3Z" />,
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
};

export function Icon({ name, className = "w-5 h-5", style }: { name: IconName; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ================= logo ================= */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-coral text-paper shrink-0"
      style={{ width: size, height: size, boxShadow: "3px 3px 0 0 #14261f" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: size * 0.62, height: size * 0.62 }}>
        <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={compact ? 32 : 38} />
      {!compact && (
        <span className="display text-xl leading-none tracking-tight">
          Strangr<span className="text-coral">Loop</span>
        </span>
      )}
    </span>
  );
}

/* ================= google brand icon ================= */
export function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/* ================= avatar ================= */
export function Avatar({ name, color, size = 44, ring = false, className = "" }: { name: string; color: string; size?: number; ring?: boolean; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white select-none shrink-0 ${ring ? "ring-[3px] ring-ink/90" : ""} ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36, fontFamily: "var(--font-display)" }}
    >
      {initials}
    </span>
  );
}

/* ================= modal ================= */
export function Modal({ open, onClose, children, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/55" onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"} animate-modal`}>{children}</div>
    </div>
  );
}

/* ================= toasts ================= */
const TOAST_STYLE: Record<string, { bg: string; icon: IconName }> = {
  info: { bg: "bg-pine text-paper", icon: "info" },
  success: { bg: "bg-teal text-seafoam", icon: "check" },
  warn: { bg: "bg-amber text-ink", icon: "alert" },
  danger: { bg: "bg-ember text-blush", icon: "alert" },
};

export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[95] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLE[t.kind];
        return (
          <button
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`animate-toast pointer-events-auto ${s.bg} border-2 border-ink rounded-xl px-4 py-3 shadow-hard-sm flex items-center gap-2.5 text-sm font-semibold text-left w-full`}
          >
            <Icon name={s.icon} className="w-4.5 h-4.5 shrink-0" />
            <span>{t.text}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ================= scroll reveal ================= */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? "reveal-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ================= misc ================= */
export function OnlinePill({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold" title="People online now">
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full bg-mint animate-pulse-dot" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-mint border border-ink/40" />
      </span>
      <span className="font-mono tracking-wide">{count.toLocaleString()}</span>
      <span className="text-fern font-semibold hidden sm:inline">online</span>
    </span>
  );
}

export function Squiggle({ className = "", color = "var(--color-coral)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 8c8-6 14-6 22 0s14 6 22 0 14-6 22 0 14 6 22 0 14-6 26-2" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}
