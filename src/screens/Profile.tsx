import { useState } from "react";
import { AVATAR_COLORS, COUNTRIES, INTERESTS, INTEREST_CATEGORIES, countryFlag, interestById } from "../data";
import { ageFromBirthDate } from "../engine";
import { useStore } from "../store";
import { Avatar, Icon, Reveal, Squiggle } from "../components/ui";

export default function Profile() {
  const { profile, saveProfile, stats, connections, toast } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [color, setColor] = useState(profile?.color ?? AVATAR_COLORS[0]);
  const [country, setCountry] = useState(profile?.country ?? "");

  if (!profile) return null;
  const age = ageFromBirthDate(profile.birthDate);

  const startEdit = () => {
    setName(profile.name);
    setBio(profile.bio);
    setInterests(profile.interests);
    setColor(profile.color);
    setCountry(profile.country);
    setEditing(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      toast("Username must be at least 3 characters.", "warn");
      return;
    }
    if (interests.length < 3) {
      toast("Keep at least 3 interests — that's how we match you.", "warn");
      return;
    }
    saveProfile({ ...profile, name: trimmed, bio: bio.trim(), interests, color, country });
    setEditing(false);
    toast("Profile updated.", "success");
  };

  const toggle = (id: string) => setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 10 ? prev : [...prev, id]));

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <Reveal>
        <div className="card card-ink overflow-hidden">
          {/* banner */}
          <div className="h-28 relative border-b-2 border-ink" style={{ background: "repeating-linear-gradient(-45deg, var(--color-parch) 0 14px, var(--color-paper) 14px 28px)" }}>
            <span className="absolute right-4 top-4 chip chip-static bg-white/80 text-xs">Public profile — strangers see this</span>
          </div>

          <div className="px-6 md:px-9 pb-8 -mt-12">
            <div className="flex items-end gap-5 mb-6">
              <Avatar name={editing ? name || "?" : profile.name} color={color} size={104} ring />
              <div className="pb-1">
                {!editing ? (
                  <>
                    <h1 className="display text-[clamp(1.9rem,4.5vw,3rem)] leading-none">{profile.name}</h1>
                    <p className="font-semibold text-fern mt-2">
                      {countryFlag(profile.country)} {profile.country}
                      {age && <span className="text-moss"> · {age.range}</span>}
                    </p>
                  </>
                ) : (
                  <div className="space-y-2 flex-1">
                    <input className="field field-sm font-bold" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
                    <select className="field field-sm text-sm" value={country} onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* bio */}
            {!editing ? (
              <p className="text-[1.02rem] font-medium text-fern mb-6 max-w-xl">
                {profile.bio || <span className="text-moss italic">No bio yet — add one so strangers know what they're getting into.</span>}
              </p>
            ) : (
              <textarea className="field mb-6" rows={3} maxLength={160} placeholder="A line about you… (160 chars)" value={bio} onChange={(e) => setBio(e.target.value)} />
            )}

            {/* interests */}
            <p className="mono-label text-fern mb-3">Interests {editing && <span className="text-coral">({interests.length}/10)</span>}</p>
            {!editing ? (
              <div className="flex flex-wrap gap-2 mb-7">
                {profile.interests.map((id) => {
                  const i = interestById(id);
                  return i ? (
                    <span key={id} className="chip chip-static">
                      <span>{i.emoji}</span> {i.label}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="space-y-4 mb-7 max-h-72 overflow-y-auto pr-2">
                {INTEREST_CATEGORIES.map((cat) => (
                  <div key={cat}>
                    <p className="mono-label text-moss mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INTERESTS.filter((i) => i.category === cat).map((i) => (
                        <button key={i.id} onClick={() => toggle(i.id)} className={`chip text-[0.82rem] ${interests.includes(i.id) ? "chip-on" : ""}`}>
                          {i.emoji} {i.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* languages */}
            {!editing && (
              <>
                <p className="mono-label text-fern mb-3">Languages</p>
                <div className="flex flex-wrap gap-2 mb-7">
                  {profile.languages.map((l) => (
                    <span key={l} className="chip chip-static bg-seafoam border-mint/40 text-teal">{l}</span>
                  ))}
                </div>
              </>
            )}

            {/* color picker */}
            {editing && (
              <>
                <p className="mono-label text-fern mb-3">Avatar color</p>
                <div className="flex gap-2.5 mb-7">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-ink scale-110 shadow-hard-sm" : "border-ink/20"}`}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* actions */}
            <div className="flex gap-3">
              {!editing ? (
                <button className="btn btn-ink" onClick={startEdit}>
                  <Icon name="pencil" className="w-4.5 h-4.5" /> Edit profile
                </button>
              ) : (
                <>
                  <button className="btn btn-coral" onClick={save}>
                    <Icon name="check" className="w-4.5 h-4.5" /> Save changes
                  </button>
                  <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* stats */}
      <Reveal delay={120}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7">
          {[
            { label: "Conversations", value: stats.chats, icon: "bubble" as const, bg: "bg-butter" },
            { label: "Connections", value: connections.length, icon: "heart-fill" as const, bg: "bg-blush" },
            { label: "Messages sent", value: stats.messages, icon: "send" as const, bg: "bg-seafoam" },
            { label: "Times hit Next", value: stats.nexts, icon: "arrow-right" as const, bg: "bg-parch" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
              <span className={`w-10 h-10 rounded-xl border-2 border-ink inline-flex items-center justify-center ${s.bg}`}>
                <Icon name={s.icon} className="w-5 h-5" />
              </span>
              <div>
                <p className="font-mono text-xl leading-none">{s.value.toLocaleString()}</p>
                <p className="text-[0.68rem] font-bold text-moss uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={200}>
        <p className="text-center text-sm font-semibold text-moss mt-8 flex items-center justify-center gap-2">
          <Icon name="lock" className="w-4 h-4" /> Your real name, email, birthday and location are never shown to other users.
          <Squiggle className="w-16 h-2 text-moss" color="var(--color-moss)" />
        </p>
      </Reveal>

    </div>
  );
}
