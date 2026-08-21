import { INTERESTS, KEYWORD_REPLIES, PERSONAS, POOL, GENERIC_STARTERS, STARTERS, countryFlag, interestById } from "./data";
import type { AgeRange, MatchResult, Persona, Prefs, Profile } from "./types";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x));

/* ---------------- scoring ---------------- */
export function scorePersona(profile: Profile, prefs: Prefs, persona: Persona): MatchResult {
  const shared = overlap(profile.interests, persona.interests);
  const sharedConv = overlap(prefs.conversationTypes, persona.conv);
  const langOverlap = overlap(profile.languages, persona.languages);
  const sharedLang = langOverlap[0] ?? null;

  const ageOk = prefs.agePref.includes(persona.age);
  const genderOk =
    prefs.genderPref === "anyone" ||
    (prefs.genderPref === "male" && persona.gender === "male") ||
    (prefs.genderPref === "female" && persona.gender === "female") ||
    (prefs.genderPref === "other" && (persona.gender === "nonbinary" || persona.gender === "private"));
  const sameCountry = profile.country === persona.country;

  let score = 0;
  score += Math.min(shared.length, 3) * 20; // shared interests, capped
  score += sharedLang ? 20 : 0; // language compatibility
  score += ageOk ? 15 : 0; // age preference
  score += genderOk ? 20 : 0; // gender preference
  score += sharedConv.length > 0 ? 15 : 0; // conversation type
  score += sameCountry ? 10 : 0; // regional boost

  let level: MatchResult["level"];
  if (shared.length >= 2 && sharedLang && ageOk && genderOk) level = 1;
  else if (shared.length >= 2 && sharedLang) level = 2;
  else if (shared.length >= 1) level = 3;
  else if (sharedLang) level = 4;
  else level = 5;

  return { persona, shared, sharedConv, sharedLang, score, pct: Math.round((score / 140) * 100), level };
}

export function pickStranger(profile: Profile, prefs: Prefs, blockedIds: string[]): MatchResult {
  const candidates = POOL.filter((p) => !blockedIds.includes(p.id));
  const scored = candidates.map((p) => scorePersona(profile, prefs, p));
  scored.sort((a, b) => b.score - a.score);
  // slight randomness among the top tier so repeats feel fresh
  const top = scored.slice(0, Math.min(3, scored.length));
  const weighted = Math.random() < 0.6 ? top[0] : pick(top);
  return weighted;
}

export function queueCandidates(profile: Profile, prefs: Prefs, blockedIds: string[], count = 5): MatchResult[] {
  const candidates = POOL.filter((p) => !blockedIds.includes(p.id));
  const scored = candidates.map((p) => scorePersona(profile, prefs, p));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count);
}

export function searchDuration(): number {
  return rand(2400, 4600);
}

/* ---------------- conversation simulation ---------------- */
export function greeting(match: MatchResult): string {
  const p = match.persona;
  const sharedLabel = match.shared.length
    ? ` also into ${match.shared.slice(0, 2).map((i) => interestById(i)?.label.toLowerCase()).join(" and ")}`
    : "";
  const openers = [
    `hey! I'm ${p.name} 👋 saw we're${sharedLabel} — this app finally matched me with someone with taste`,
    `heyy ${sharedLabel ? `fellow ${interestById(match.shared[0])?.label.toLowerCase()} enjoyer` : "stranger"}! I'm ${p.name} ${p.flag} how's it going`,
    `oh nice, a match! I'm ${p.name}.${sharedLabel ? ` we both like ${interestById(match.shared[0])?.label} so this should be good` : ""}`,
  ];
  return pick(openers);
}

export function startersFor(match: MatchResult): string[] {
  const fromShared = match.shared
    .flatMap((id) => STARTERS.find((s) => s.interest === id)?.starters ?? [])
    .slice(0, 2);
  const extras = pick([GENERIC_STARTERS, GENERIC_STARTERS]);
  const set = [...fromShared];
  while (set.length < 3) {
    const g = pick(extras);
    if (!set.includes(g)) set.push(g);
  }
  return set.slice(0, 3);
}

export function replyDelay(persona: Persona, text: string): number {
  const base = rand(1100, 2500) / persona.speed;
  const reading = Math.min(1400, text.length * 18);
  return base + reading;
}

export function makeReply(persona: Persona, userText: string, msgIndex: number): string {
  const lower = userText.toLowerCase();
  const isQuestion = userText.trim().endsWith("?");

  // keyword-driven first
  for (const group of KEYWORD_REPLIES) {
    if (group.keys.some((k) => lower.includes(k))) {
      return pick(group.replies);
    }
  }

  const asks = userText.trim().endsWith("?");
  if (isQuestion || asks) {
    // answer-ish moves: persona line + bounce a question back
    return msgIndex % 2 === 0 ? `${pick(persona.lines)} ${pick(persona.questions)}` : pick(persona.questions);
  }

  // short acknowledgements for tiny messages
  if (userText.trim().length < 4) {
    return pick(["ha, straight to it. I like it", "ok ok 👀 go on", `${pick(persona.questions)}`]);
  }

  const line = persona.lines[msgIndex % persona.lines.length];
  // every ~3rd message, ask something back to keep the conversation alive
  if (msgIndex % 3 === 2) {
    return `${line} ${pick(persona.questions)}`;
  }
  return line;
}

export function acceptProbability(persona: Persona, messageCount: number): number {
  return Math.min(0.95, persona.willingness + messageCount * 0.045);
}

/* ---------------- live world simulation ---------------- */
export function randomQueuePersonas(blockedIds: string[], count: number): Persona[] {
  const pool = PERSONAS.filter((p) => !blockedIds.includes(p.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function randomFlagCountry(): { name: string; flag: string } {
  const c = pick(POOL).country;
  return { name: c, flag: countryFlag(c) };
}

export function interestLabel(id: string): { label: string; emoji: string } {
  const i = interestById(id);
  return i ? { label: i.label, emoji: i.emoji } : { label: id, emoji: "•" };
}

export function ageFromBirthDate(dob: string): { range: AgeRange; age: number } | null {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (age < 18) return null;
  if (age <= 24) return { range: "18–24", age };
  if (age <= 34) return { range: "25–34", age };
  if (age <= 44) return { range: "35–44", age };
  return { range: "45+", age };
}

export const INTEREST_ALL = INTERESTS;
