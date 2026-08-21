import { useEffect, useState } from "react";
import { continueAsGuest, googleSignInAvailable, signInWithEmail, signInWithGoogle, signUpWithEmail } from "../auth";
import { APP_NAME, AUTH_MODE, DEMO_AUTH_ENABLED, TAGLINE } from "../config";
import { useStore } from "../store";
import { GoogleIcon, Icon, LogoMark } from "../components/ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INTEREST_TAGS: string[] = [
  "💻 Programming", "🤖 AI", "🎮 PC Gaming", "🎬 Movies", "🎧 Music", "✈️ Travel", "📚 Books",
  "🚀 Startups", "🔬 Science", "🍜 Food", "⚖️ Debate", "📷 Photography", "🗣️ Languages", "💪 Fitness",
];

export default function AuthScreen() {
  const { toast } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"form" | "google" | "guest" | null>(null);

  useEffect(() => {
    setError("");
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy("form");
    try {
      const user = mode === "signup" ? await signUpWithEmail(email.trim(), password) : await signInWithEmail(email.trim(), password);
      toast(`Welcome, ${user.name} — you're in.`, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError("");
    if (!googleSignInAvailable) {
      setError("Google sign-in needs Supabase keys in your .env — the README walks you through it in 5 minutes.");
      return;
    }
    setBusy("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setBusy(null);
    }
  };

  const guest = async () => {
    setError("");
    setBusy("guest");
    try {
      const user = await continueAsGuest();
      toast(`Exploring as ${user.name} — everything saves in this browser.`, "info");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start guest mode.");
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr] noise">
      {/* ================= left: brand panel ================= */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-pine text-paper px-12 py-10">
        <div className="absolute inset-0 bg-dots opacity-[0.16] pointer-events-none" />
        {/* oversized loop mark */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="absolute -right-24 -bottom-28 w-[34rem] h-[34rem] text-paper/8 rotate-12 pointer-events-none" aria-hidden="true">
          <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" strokeLinecap="round" />
        </svg>

        <div className="relative flex items-center gap-3">
          <LogoMark size={44} />
          <span className="display text-2xl tracking-tight">
            Strangr<span className="text-amber">Loop</span>
          </span>
        </div>

        <div className="relative">
          <p className="mono-label text-amber mb-5">strangrloop.chat · 18+ · moderated</p>
          <h1 className="display text-[clamp(2.8rem,4.5vw,4.2rem)] leading-[0.98] mb-6">
            Random chats.
            <br />
            Real <span className="text-amber">connections</span>.
          </h1>
          <p className="text-paper/75 font-medium text-lg max-w-md mb-9">
            Skip the small-talk lottery. We match you with strangers who share your interests — score them on language, age and vibe — then get out of the way.
          </p>
          <div className="space-y-3 max-w-md">
            {[
              { icon: "radar" as const, t: "Scoring-based matching", d: "+20 per shared interest, +20 language, +15 your preferences." },
              { icon: "shield" as const, t: "Safety baked in", d: "Anonymous reports, one-tap blocks, content filtering — free, always." },
              { icon: "heart" as const, t: "Connections that stick", d: "Mutual connects land in your loop — message them again anytime." },
            ].map((x) => (
              <div key={x.t} className="flex items-start gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-paper/12 border border-paper/20 inline-flex items-center justify-center shrink-0">
                  <Icon name={x.icon} className="w-4.5 h-4.5 text-amber" />
                </span>
                <div>
                  <p className="font-bold leading-tight">{x.t}</p>
                  <p className="text-sm text-paper/60 font-medium">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative -mx-12 border-t border-paper/15 px-12 pt-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {INTEREST_TAGS.map((t) => (
              <span key={t} className="text-sm font-bold text-paper/50">
                {t}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= right: form panel ================= */}
      <main className="relative flex items-center justify-center px-5 py-10 lg:py-0">
        <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />
        <div className="relative w-full max-w-md animate-rise">
          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <LogoMark size={42} />
            <div>
              <span className="display text-2xl tracking-tight block leading-none">
                Strangr<span className="text-coral">Loop</span>
              </span>
              <span className="text-xs font-bold text-fern">{TAGLINE}</span>
            </div>
          </div>

          <div className="card card-ink bg-paper p-7 sm:p-8">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <p className="mono-label text-coral">
                  {AUTH_MODE === "supabase" ? "Secure sign-in · Supabase" : "No server needed yet"}
                </p>
                <h2 className="display text-[1.9rem] leading-tight">
                  {mode === "signin" ? "Back in the loop." : "Join the loop."}
                </h2>
              </div>
              <span
                className={`chip chip-static chip-pad text-[0.68rem] ${AUTH_MODE === "supabase" ? "bg-seafoam border-mint text-teal" : "bg-butter border-amber text-ink"}`}
                title={AUTH_MODE === "supabase" ? "Real auth via Supabase" : "Demo auth — accounts live in this browser"}
              >
                {AUTH_MODE === "supabase" ? "● live auth" : "● demo auth"}
              </span>
            </div>
            <p className="text-sm font-medium text-fern mb-6">
              {mode === "signin"
                ? "Sign in to keep your connections and preferences."
                : "One account. Your profile, connections and blocks — kept."}
            </p>

            {/* tabs */}
            <div className="grid grid-cols-2 rounded-xl border-2 border-ink bg-white p-1 mb-6" role="tablist">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${mode === m ? "bg-ink text-paper shadow-hard-sm" : "text-fern hover:text-ink"}`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mono-label text-fern">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  className="field mt-1.5"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mono-label text-fern">Password</span>
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="field mt-1.5"
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error && (
                <p className="flex items-start gap-2 text-coral font-bold text-sm animate-pop" role="alert">
                  <Icon name="alert" className="w-4.5 h-4.5 shrink-0 mt-0.5" /> {error}
                </p>
              )}

              <button type="submit" className="btn btn-coral btn-md w-full" disabled={busy !== null}>
                {busy === "form" ? <Spinner /> : <Icon name="bolt" className="w-4.5 h-4.5" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5" aria-hidden="true">
              <span className="h-0.5 flex-1 bg-ink/10" />
              <span className="mono-label text-moss">or</span>
              <span className="h-0.5 flex-1 bg-ink/10" />
            </div>

            <button className="btn btn-md w-full bg-white!" onClick={google} disabled={busy !== null}>
              {busy === "google" ? <Spinner /> : <GoogleIcon className="w-5 h-5" />}
              Continue with Google
            </button>
            {!googleSignInAvailable && (
              <p className="text-[0.7rem] font-semibold text-moss mt-2 leading-snug">
                Google OAuth activates once <code className="font-mono bg-ink/6 px-1 rounded">VITE_SUPABASE_*</code> keys are in your <code className="font-mono bg-ink/6 px-1 rounded">.env</code> (README → “Auth setup”).
              </p>
            )}

            {AUTH_MODE === "demo" && DEMO_AUTH_ENABLED && (
              <button className="btn btn-ghost w-full mt-3 text-fern" onClick={guest} disabled={busy !== null}>
                {busy === "guest" ? <Spinner /> : <Icon name="spark" className="w-4.5 h-4.5 text-amber" />}
                Just exploring? Continue as guest
              </button>
            )}
          </div>

          <p className="text-center text-xs font-semibold text-moss mt-5 leading-relaxed">
            18+ only · your email is never shown to strangers — they only ever see your display name.
            <br />
            By continuing you agree to the community guidelines and safety rules.
          </p>
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return <span className="w-4.5 h-4.5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" aria-label="Loading" />;
}
