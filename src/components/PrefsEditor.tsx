import { AGE_RANGES, CONVERSATION_TYPES, LANGUAGES } from "../data";
import type { AgeRange, GenderPref, Prefs } from "../types";
import { Icon } from "./ui";

const GENDER_PREFS: { id: GenderPref; label: string }[] = [
  { id: "anyone", label: "Anyone" },
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function PrefsEditor({ prefs, onChange }: { prefs: Prefs; onChange: (p: Prefs) => void }) {
  return (
    <div className="space-y-7">
      {/* gender pref */}
      <div>
        <p className="mono-label text-fern mb-2.5">Who do you want to meet?</p>
        <div className="grid grid-cols-4 gap-2">
          {GENDER_PREFS.map((g) => (
            <button
              key={g.id}
              onClick={() => onChange({ ...prefs, genderPref: g.id })}
              className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition-all ${
                prefs.genderPref === g.id
                  ? "bg-ink text-paper border-ink shadow-hard-sm -translate-y-0.5"
                  : "bg-white border-ink/15 hover:border-ink"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* age pref */}
      <div>
        <p className="mono-label text-fern mb-2.5">Age range</p>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((a: AgeRange) => (
            <button
              key={a}
              onClick={() => onChange({ ...prefs, agePref: toggleIn(prefs.agePref, a) })}
              className={`chip ${prefs.agePref.includes(a) ? "chip-on" : ""}`}
            >
              {prefs.agePref.includes(a) && <Icon name="check" className="w-3.5 h-3.5" />}
              {a}
            </button>
          ))}
        </div>
        {prefs.agePref.length === 0 && <p className="text-xs text-coral font-semibold mt-2">Pick at least one range so we know who to show you.</p>}
      </div>

      {/* languages */}
      <div>
        <p className="mono-label text-fern mb-2.5">Languages you can chat in</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button key={l} onClick={() => onChange({ ...prefs, languages: toggleIn(prefs.languages, l) })} className={`chip ${prefs.languages.includes(l) ? "chip-on" : ""}`}>
              {prefs.languages.includes(l) && <Icon name="check" className="w-3.5 h-3.5" />}
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* conversation types */}
      <div>
        <p className="mono-label text-fern mb-2.5">Conversation mood</p>
        <div className="flex flex-wrap gap-2">
          {CONVERSATION_TYPES.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ ...prefs, conversationTypes: toggleIn(prefs.conversationTypes, c.id) })}
              className={`chip ${prefs.conversationTypes.includes(c.id) ? "chip-on" : ""}`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
