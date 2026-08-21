export type Gender = "male" | "female" | "nonbinary" | "private";
export type GenderPref = "anyone" | "male" | "female" | "other";
export type AgeRange = "18–24" | "25–34" | "35–44" | "45+";

export interface Profile {
  name: string;
  birthDate: string;
  gender: Gender;
  country: string;
  languages: string[];
  interests: string[];
  bio: string;
  color: string;
}

export interface Prefs {
  genderPref: GenderPref;
  agePref: AgeRange[];
  languages: string[];
  conversationTypes: string[];
}

export interface Persona {
  id: string;
  name: string;
  gender: Gender;
  age: AgeRange;
  country: string;
  flag: string;
  languages: string[];
  interests: string[];
  conv: string[];
  bio: string;
  willingness: number; // 0..1 chance to accept a connect
  speed: number; // typing speed multiplier
  lines: string[];
  questions: string[];
}

export interface MatchResult {
  persona: Persona;
  shared: string[];
  sharedConv: string[];
  sharedLang: string | null;
  score: number;
  pct: number;
  level: 1 | 2 | 3 | 4 | 5;
}

export interface Connection {
  id: string;
  personaId: string;
  name: string;
  flag: string;
  country: string;
  interests: string[];
  shared: string[];
  metAt: number;
  color: string;
}

export interface BlockedUser {
  personaId: string;
  name: string;
  at: number;
  reason: string;
}

export interface ChatMsg {
  id: string;
  from: "me" | "them" | "system";
  text: string;
  at: number;
}

export interface Toast {
  id: number;
  text: string;
  kind: "info" | "success" | "warn" | "danger";
}

export interface SessionStats {
  chats: number;
  nexts: number;
  connects: number;
  reports: number;
  messages: number;
}

export interface UserSettings {
  notifyConnect: boolean;
  showCountry: boolean;
  showAge: boolean;
}

export type Flow =
  | { stage: "idle" }
  | { stage: "searching" }
  | { stage: "intro"; match: MatchResult }
  | { stage: "chat"; match: MatchResult };

export type View = "home" | "connections" | "profile" | "settings";
