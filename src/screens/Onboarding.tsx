import { useMemo, useState } from "react";
import { AGE_RANGES, AVATAR_COLORS, CONVERSATION_TYPES, COUNTRIES, INTERESTS, INTEREST_CATEGORIES, LANGUAGES } from "../data";
import { ageFromBirthDate } from "../engine";
import { useStore } from "../store";
import type { Gender, Profile } from "../types";
import { Icon, LogoMark, Reveal, Squiggle } from "../components/ui";
import PrefsEditor from "../components/PrefsEditor";
import type { Prefs } from "../types";

const STEPS = ["Welcome", "Identity", "Languages", "Interests", "Preferences"];

const GENDERS: { id: Gender; label: string; hint: string }[] = [
  { id: "male", label: "Male", hint: "Shown as a preference, never as a dossier" },
  { id: "female", label: "Female", hint: "Shown as a preference, never as a dossier" },
  { id: "nonbinary", label: "Non-binary / other", hint: "You do you" },
  { id: "private", label: "Prefer not to say", hint: "Totally fine — matching stays broad" },
];

export default function Onboarding() {
  const { saveProfile, setPrefs, toast } = useStore();
  const [step, setStep] = useState(0);

  // step state
  const [dob, setDob] = useState("");
  const [adult, setAdult] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [country, setCountry] = useState("");
  const [langs, setLangs] = useState<string[]>(["English"]);
  const [interests, setInterests] = useState<string[]>([]);
  const [prefs, setPrefsLocal] = useState<Prefs>({ genderPref: "anyone", agePref: [...AGE_RANGES], languages: ["English"], conversationTypes: ["casual"] });
  const [error, setError] = useState("");

  const fail = (msg: string) => {
    setError(msg);
  };

  const age = useMemo(() => (dob ? ageFromBirthDate(dob) : null), [dob]);

  const next = () => {
    setError("");
    if (step === 0) {
      if (!dob) return fail("Enter your date of birth so we can verify you're 18+.");
      if (!age) return fail("StrangrLoop is for adults only — you must be 18 or older.");
      if (!adult) return fail("Please confirm you're 18+ and accept the community guidelines.");
    }
    if (step === 1) {
      const trimmed = name.trim();
      if (trimmed.length < 3 || trimmed.length > 16) return fail("Username must be 3–16 characters.");
      if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) return fail("Letters, numbers, spaces and underscores only.");
      if (!gender) return fail("Pick the option that fits you best — 'prefer not to say' counts.");
      if (!country) return fail("Pick your country — it's only used as a fuzzy matching hint.");
    }
    if (step === 2) {
      if (langs.length === 0) return fail("Pick at least one language you can chat in.");
    }
    if (step === 3) {
      if (interests.length < 3) return fail(`Pick at least 3 interests — you have ${interests.length}.`);
      if (interests.length > 10) return fail("Keep it to 10 interests max — quality over quantity.");
    }
    if (step === 4) {
      if (prefs.agePref.length === 0) return fail("Pick at least one age range.");
      if (prefs.conversationTypes.length === 0) return fail("Pick at least one conversation mood.");
      // done
      const profile: Profile = {
        name: name.trim(),
        birthDate: dob,
        gender: gender as Gender,
        country,
        languages: langs,
        interests,
        bio: "",
        color: AVATAR_COLORS[name.trim().length % AVATAR_COLORS.length],
      };
      saveProfile(profile);
      setPrefs(prefs);
      toast(`Welcome aboard, ${profile.name} — let's find your people.`, "success");
      return;
    }
    setStep((s) => s + 1);
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 10 ? prev : [...prev, id]));
  };

  return (
    <div className="min-h-screen noise relative">
      <div className="absolute inset-0 bg-dots opacity-60 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5 pt-8 pb-24">
        {/* header */}
        <header className="flex items-center justify-between mb-10">
          <span className="inline-flex items-center gap-2.5">
            <LogoMark size={40} />
            <span className="display text-2xl tracking-tight">
              Wave<span className="text-coral">length</span>
            </span>
          </span>
          {/* progress */}
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <span key={s} className={`h-2 rounded-full transition-all duration-500 ${i === step ? "w-8 bg-coral" : i < step ? "w-2 bg-ink" : "w-2 bg-ink/15"}`} />
            ))}
          </div>
        </header>

        <div>
          {/* ---------------- STEP 0 : WELCOME ---------------- */}
          {step === 0 && (
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center animate-rise">
              <div>
                <p className="mono-label text-coral mb-4">Random strangers • Shared interests • Real talk</p>
                <h1 className="display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.98] mb-5">
                  Skip the small-talk
                  <br />
                  <span className="relative inline-block">
                    lottery.
                    <Squiggle className="absolute -bottom-2 left-0 w-full h-3" />
                  </span>
                </h1>
                <p className="text-lg text-fern font-medium max-w-xl mb-8">
                  StrangrLoop drops you into a text chat with a random stranger — but one who actually shares your interests.
                  Talk, hit <b className="text-ink">Next</b> anytime, or <b className="text-coral">Connect</b> when it clicks.
                </p>

                <div className="space-y-4 mb-9">
                  {[
                    { n: "01", t: "Tell us what you're into", d: "Pick 3–10 interests, from Programming to K-drama debates." },
                    { n: "02", t: "We score the queue", d: "Shared interests +20, language +20, your preferences +15… best match wins." },
                    { n: "03", t: "Chat in seconds", d: "No profiles to swipe. You land straight into a conversation." },
                  ].map((x) => (
                    <div key={x.n} className="flex gap-4 items-start">
                      <span className="display text-coral text-lg mt-0.5">{x.n}</span>
                      <div>
                        <p className="font-bold text-[1.02rem] leading-tight">{x.t}</p>
                        <p className="text-fern text-sm font-medium">{x.d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* age gate */}
                <div className="card card-ink p-5 max-w-xl">
                  <p className="mono-label text-fern mb-3">Age check — adults only</p>
                  <div className="flex flex-wrap gap-4 items-end">
                    <label className="flex-1 min-w-[190px]">
                      <span className="block text-xs font-bold mb-1.5 text-fern">Date of birth</span>
                      <input type="date" className="field" value={dob} max="2010-01-01" onChange={(e) => setDob(e.target.value)} />
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none pb-2.5">
                      <span
                        onClick={() => setAdult((a) => !a)}
                        className={`w-6 h-6 rounded-md border-2 border-ink inline-flex items-center justify-center transition-colors ${adult ? "bg-mint" : "bg-white"}`}
                      >
                        {adult && <Icon name="check" className="w-4 h-4 text-ink" />}
                      </span>
                      <span className="text-sm font-semibold" onClick={() => setAdult((a) => !a)}>
                        I'm 18+ and I'll follow the <u className="decoration-coral decoration-2">guidelines</u>
                      </span>
                    </label>
                  </div>
                  {age && <p className="text-xs font-semibold text-teal mt-3">✓ Verified adult ({age.range} bracket). Your exact birthday is never shown to anyone.</p>}
                </div>
              </div>

              {/* conversation preview */}
              <div className="relative hidden lg:block">
                <div className="rounded-2xl border-2 border-ink shadow-hard overflow-hidden bg-white">
                  <div className="bg-pine text-paper px-5 py-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-mint border-2 border-ink inline-flex items-center justify-center font-bold text-ink text-sm">AK</span>
                    <div className="flex-1">
                      <p className="font-bold leading-tight">Aarav 🇮🇳</p>
                      <p className="text-[0.7rem] font-mono text-paper/60">92% match · 3 shared interests</p>
                    </div>
                    <span className="chip chip-static chip-pad text-[0.68rem] bg-seafoam border-mint text-teal">online</span>
                  </div>
                  <div className="px-5 py-5">
                    <p className="mono-label text-moss mb-2.5">You both like</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="chip chip-static bg-butter border-ink/25">💻 Programming</span>
                      <span className="chip chip-static bg-butter border-ink/25">🤖 AI</span>
                      <span className="chip chip-static bg-butter border-ink/25">🚀 Startups</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white border-2 border-ink/12 px-4 py-2.5">
                          <p className="text-[0.92rem] font-medium leading-relaxed">I've been deep in a FastAPI + React rabbit hole this week — what are you building?</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink text-paper px-4 py-2.5">
                          <p className="text-[0.92rem] font-medium leading-relaxed">A RAG pipeline for my lecture notes. Ask me anything 🙃</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-ink/10 bg-parch px-5 py-3.5 flex items-center gap-2.5">
                    <span className="flex-1 rounded-xl border-2 border-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-moss">Type a message…</span>
                    <span className="btn btn-coral btn-sm pointer-events-none">Next →</span>
                  </div>
                </div>
                <p className="text-center text-xs font-semibold text-moss mt-4">A real conversation, seconds after hitting Find.</p>
              </div>
            </div>
          )}

          {/* ---------------- STEP 1 : IDENTITY ---------------- */}
          {step === 1 && (
            <div className="max-w-2xl animate-rise">
              <p className="mono-label text-coral mb-3">Step 2 — who's talking?</p>
              <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] leading-tight mb-2">Pick a handle.</h2>
              <p className="text-fern font-medium mb-8">This is the only name strangers ever see. No real names, no emails, no phone numbers. Ever.</p>

              <label className="block mb-6">
                <span className="mono-label text-fern">Display name</span>
                <input
                  className="field mt-2 text-lg font-bold"
                  placeholder="e.g. MidnightCoder"
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                />
                <span className="text-xs font-semibold text-moss mt-1.5 block">{name.trim().length}/16</span>
              </label>

              <p className="mono-label text-fern mb-2.5">Gender</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-7">
                {GENDERS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    className={`text-left rounded-xl border-2 px-4 py-3.5 transition-all ${
                      gender === g.id ? "border-ink bg-butter shadow-hard-sm -translate-y-0.5" : "border-ink/15 bg-white hover:border-ink"
                    }`}
                  >
                    <span className="font-bold block">{g.label}</span>
                    <span className="text-xs font-medium text-fern">{g.hint}</span>
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mono-label text-fern">Country</span>
                <select className="field mt-2" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* ---------------- STEP 2 : LANGUAGES ---------------- */}
          {step === 2 && (
            <div className="max-w-2xl animate-rise">
              <p className="mono-label text-coral mb-3">Step 3 — how do you talk?</p>
              <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] leading-tight mb-2">Languages.</h2>
              <p className="text-fern font-medium mb-8">
                Matching prioritizes people you can actually converse with. A shared language is worth <b className="text-ink">+20 match points</b>.
              </p>
              <p className="mono-label text-fern mb-3">Select all you can chat in</p>
              <div className="flex flex-wrap gap-2.5">
                {LANGUAGES.map((l) => {
                  const on = langs.includes(l);
                  return (
                    <button
                      key={l}
                      onClick={() => setLangs((prev) => (on ? prev.filter((x) => x !== l) : [...prev, l]))}
                      className={`chip text-[0.95rem] px-4 py-2.5 ${on ? "chip-on" : ""}`}
                    >
                      {on && <Icon name="check" className="w-4 h-4" />}
                      {l}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm font-semibold text-teal mt-5">{langs.length} selected</p>
            </div>
          )}

          {/* ---------------- STEP 3 : INTERESTS ---------------- */}
          {step === 3 && (
            <div className="max-w-3xl animate-rise">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
                <div>
                  <p className="mono-label text-coral mb-3">Step 4 — the important part</p>
                  <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] leading-tight">What are you into?</h2>
                </div>
                <span className={`display text-2xl ${interests.length >= 3 ? "text-teal" : "text-coral"}`}>
                  {interests.length}<span className="text-fern text-lg">/10</span>
                </span>
              </div>
              <p className="text-fern font-medium mb-7">Pick 3–10. Each shared interest is worth +20 match points — this is literally how we find your people.</p>

              <div className="space-y-6">
                {INTEREST_CATEGORIES.map((cat) => (
                  <div key={cat}>
                    <p className="mono-label text-moss mb-2.5">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.filter((i) => i.category === cat).map((i) => {
                        const on = interests.includes(i.id);
                        return (
                          <button key={i.id} onClick={() => toggleInterest(i.id)} className={`chip ${on ? "chip-on" : ""}`}>
                            <span>{i.emoji}</span>
                            {i.label}
                            {on && <Icon name="check" className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- STEP 4 : PREFERENCES ---------------- */}
          {step === 4 && (
            <div className="max-w-2xl animate-rise">
              <p className="mono-label text-coral mb-3">Last step — tuning the radar</p>
              <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] leading-tight mb-2">Matching preferences.</h2>
              <p className="text-fern font-medium mb-8">You can change all of this anytime. If the queue is thin, we relax constraints level by level so you're never left staring at "no one found".</p>
              <PrefsEditor prefs={prefs} onChange={setPrefsLocal} />
            </div>
          )}
        </div>

        {/* error + nav */}
        {error && (
          <p className="flex items-center gap-2 text-coral font-bold text-sm mt-6" role="alert">
            <Icon name="alert" className="w-4.5 h-4.5" /> {error}
          </p>
        )}

        <div className="flex items-center gap-3 mt-9">
          {step > 0 && (
            <button className="btn" onClick={() => { setError(""); setStep((s) => s - 1); }}>
              Back
            </button>
          )}
          <button className="btn btn-coral text-lg px-8 py-3.5" onClick={next}>
            {step === 4 ? "Enter StrangrLoop" : "Continue"}
            <Icon name="arrow-right" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


