import { useState } from "react";
import { GUIDELINES, SAFETY_TIPS } from "../data";
import { useStore } from "../store";
import type { Prefs } from "../types";
import { Icon, Modal, Reveal } from "../components/ui";
import PrefsEditor from "../components/PrefsEditor";

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <p className="font-bold text-[0.95rem] leading-tight">{label}</p>
        <p className="text-xs font-medium text-moss mt-0.5">{hint}</p>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`w-13 h-7 rounded-full border-2 border-ink p-0.5 transition-colors shrink-0 ${on ? "bg-mint" : "bg-ink/10"}`}
        style={{ width: 52 }}
        role="switch"
        aria-checked={on}
        aria-label={label}
      >
        <span className={`block w-5.5 h-5.5 bg-white rounded-full border border-ink/30 transition-transform duration-200 ${on ? "translate-x-[22px]" : ""}`} style={{ width: 22, height: 22 }} />
      </button>
    </div>
  );
}

function Section({ title, icon, children, delay = 0 }: { title: string; icon: Parameters<typeof Icon>[0]["name"]; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <section className="card p-6 mb-5">
        <h2 className="display text-xl mb-1 flex items-center gap-2.5">
          <Icon name={icon} className="w-5.5 h-5.5 text-coral" /> {title}
        </h2>
        <div className="mt-3">{children}</div>
      </section>
    </Reveal>
  );
}

export default function Settings() {
  const { prefs, setPrefs, settings, setSettings, blocked, unblockUser, resetAccount, toast } = useStore();
  const [editPrefs, setEditPrefs] = useState(false);
  const [draft, setDraft] = useState<Prefs>(prefs);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const saveDraft = () => {
    if (draft.agePref.length === 0 || draft.conversationTypes.length === 0) {
      toast("Keep at least one age range and one conversation mood.", "warn");
      return;
    }
    setPrefs(draft);
    setEditPrefs(false);
    toast("Matching preferences saved.", "success");
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <Reveal>
        <p className="mono-label text-coral mb-3">Control room</p>
        <h1 className="display text-[clamp(2.2rem,5vw,3.4rem)] leading-none mb-9">Settings</h1>
      </Reveal>

      {/* matching */}
      <Section title="Matching preferences" icon="radar">
        {!editPrefs ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="chip chip-static">{prefs.genderPref === "anyone" ? "🌐 Anyone" : `👤 ${prefs.genderPref}`}</span>
              <span className="chip chip-static">🎂 {prefs.agePref.length === 4 ? "All 18+" : prefs.agePref.join(" · ")}</span>
              <span className="chip chip-static">🗣️ {prefs.languages.slice(0, 3).join(", ")}</span>
              <span className="chip chip-static">💬 {prefs.conversationTypes.length} mood{prefs.conversationTypes.length > 1 ? "s" : ""}</span>
            </div>
            <button className="btn" onClick={() => { setDraft(prefs); setEditPrefs(true); }}>
              <Icon name="pencil" className="w-4 h-4" /> Edit preferences
            </button>
          </>
        ) : (
          <>
            <PrefsEditor prefs={draft} onChange={setDraft} />
            <div className="flex gap-3 mt-6">
              <button className="btn btn-coral" onClick={saveDraft}><Icon name="check" className="w-4 h-4" /> Save</button>
              <button className="btn" onClick={() => setEditPrefs(false)}>Cancel</button>
            </div>
          </>
        )}
      </Section>

      {/* notifications */}
      <Section title="Notifications" icon="bolt" delay={60}>
        <div className="divide-y divide-ink/8">
          <Toggle
            on={settings.notifyConnect}
            onChange={(v) => { setSettings({ notifyConnect: v }); toast(v ? "Connection notifications on." : "Connection notifications off.", "info"); }}
            label="Connection requests"
            hint="Get nudged when someone from a chat wants to connect."
          />
          <div className="flex items-center justify-between gap-4 py-3.5 opacity-50">
            <div>
              <p className="font-bold text-[0.95rem] leading-tight">Messages from connections</p>
              <p className="text-xs font-medium text-moss mt-0.5">Direct messaging arrives in V2.</p>
            </div>
            <span className="chip chip-static text-xs">Soon</span>
          </div>
        </div>
      </Section>

      {/* privacy */}
      <Section title="Privacy" icon="lock" delay={120}>
        <div className="divide-y divide-ink/8 mb-5">
          <Toggle on={settings.showCountry} onChange={(v) => setSettings({ showCountry: v })} label="Show my country flag in chat" hint="Strangers see your flag, never your city or location." />
          <Toggle on={settings.showAge} onChange={(v) => setSettings({ showAge: v })} label="Show my age range" hint="Only the bracket (e.g. 25–34) — never your birthday." />
        </div>

        <p className="mono-label text-fern mb-3">Blocked users ({blocked.length})</p>
        {blocked.length === 0 ? (
          <p className="text-sm font-medium text-moss">Nobody blocked. You can block anyone from the chat menu, anytime.</p>
        ) : (
          <div className="space-y-2">
            {blocked.map((b) => (
              <div key={b.personaId} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/12 bg-white px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon name="ban" className="w-4.5 h-4.5 text-ember shrink-0" />
                  <span className="font-bold text-sm truncate">{b.name}</span>
                  <span className="text-xs font-semibold text-moss hidden sm:inline">
                    {new Date(b.at).toLocaleDateString()} · {b.reason === "blocked" ? "blocked" : "reported & blocked"}
                  </span>
                </div>
                <button className="btn btn-sm text-xs" onClick={() => { unblockUser(b.personaId); toast(`${b.name} unblocked.`, "info"); }}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* safety */}
      <Section title="Safety center" icon="shield" delay={180}>
        <p className="text-sm font-medium text-fern mb-4">
          Every chat has one-tap report and block. Reports are anonymous, reviewed by humans, and severe cases are escalated immediately.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-mint" onClick={() => setGuidelinesOpen(true)}>
            <Icon name="users" className="w-4.5 h-4.5" /> Community guidelines
          </button>
          <button className="btn" onClick={() => setSafetyOpen(true)}>
            <Icon name="shield" className="w-4.5 h-4.5 text-teal" /> Safety tips
          </button>
        </div>
      </Section>

      {/* account */}
      <Section title="Account" icon="user" delay={240}>
        <p className="text-sm font-medium text-fern mb-4">
          Your data lives in your browser for this demo. Deleting your account wipes your profile, connections, blocks and stats — instantly, no hoops.
        </p>
        <button className="btn btn-danger" onClick={() => { setDeleteText(""); setDeleteOpen(true); }}>
          <Icon name="trash" className="w-4.5 h-4.5" /> Delete account
        </button>
      </Section>

      <p className="text-center text-xs font-semibold text-moss mt-10 mb-4">
        Wavelength · interest-based social discovery · 18+ only · v1.0 demo
      </p>

      {/* guidelines modal */}
      <Modal open={guidelinesOpen} onClose={() => setGuidelinesOpen(false)} wide>
        <div className="card card-ink p-6 md:p-8 bg-paper">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="mono-label text-coral">The rules of the wave</p>
              <h3 className="display text-3xl">Community guidelines</h3>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => setGuidelinesOpen(false)} aria-label="Close"><Icon name="x" className="w-5 h-5" /></button>
          </div>
          <ol className="space-y-3">
            {GUIDELINES.map((g, i) => (
              <li key={i} className="flex gap-3.5 items-start">
                <span className="display text-coral w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-[0.95rem] font-medium text-fern leading-relaxed">{g}</p>
              </li>
            ))}
          </ol>
          <p className="text-xs font-semibold text-moss mt-6">Breaking these gets your account warned, suspended, or banned — automated systems flag, humans decide.</p>
        </div>
      </Modal>

      {/* safety modal */}
      <Modal open={safetyOpen} onClose={() => setSafetyOpen(false)}>
        <div className="card card-ink p-6 bg-paper">
          <div className="flex items-start justify-between mb-5">
            <h3 className="display text-2xl flex items-center gap-2.5"><Icon name="shield" className="w-6 h-6 text-teal" /> Stay safe</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setSafetyOpen(false)} aria-label="Close"><Icon name="x" className="w-5 h-5" /></button>
          </div>
          <ul className="space-y-3">
            {SAFETY_TIPS.map((t, i) => (
              <li key={i} className="flex gap-2.5 text-sm font-medium text-fern">
                <Icon name="check" className="w-4.5 h-4.5 text-mint shrink-0 mt-0.5" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      {/* delete modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="card card-ink p-6 bg-paper">
          <span className="w-14 h-14 mx-auto rounded-full bg-blush border-2 border-ink inline-flex items-center justify-center mb-4">
            <Icon name="alert" className="w-7 h-7 text-ember" />
          </span>
          <h3 className="display text-2xl text-center mb-2">Delete your account?</h3>
          <p className="text-sm font-medium text-fern text-center mb-5">
            This erases your profile, preferences, connections, blocked list and stats from this device. There's no undo.
          </p>
          <label className="block mb-5">
            <span className="text-xs font-bold text-fern block mb-1.5">Type <b className="text-ember">DELETE</b> to confirm</span>
            <input className={`field text-center font-mono tracking-widest ${deleteText !== "" && deleteText !== "DELETE" ? "field-err" : ""}`} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE" />
          </label>
          <div className="flex gap-3">
            <button className="btn flex-1" onClick={() => setDeleteOpen(false)}>Keep my account</button>
            <button
              className="btn btn-coral flex-1"
              disabled={deleteText !== "DELETE"}
              onClick={() => {
                resetAccount();
                setDeleteOpen(false);
              }}
            >
              <Icon name="trash" className="w-4.5 h-4.5" /> Delete forever
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
