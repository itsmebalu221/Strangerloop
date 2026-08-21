/**
 * Scoring-based matchmaking — mirrors the client-side algorithm so sim and
 * live behave identically:
 *   shared interests +20 (cap 60) · shared language +20 · age compat +15
 *   gender prefs +20 (10 per direction) · shared conversation type +15 · country +10
 *
 * Fallback ladder (relaxes as wait time grows, so nobody sits on "no one found"):
 *   L1 exact prefs · L2 relax age · L3 relax interests · L4 language-first · L5 best available
 */
import { randomUUID } from "node:crypto";
import { PAIRING_INTERVAL_MS, type AgeRange, type Gender, type GenderPref, type LiveMatch, type Prefs, type PublicProfile } from "./config.js";
import * as db from "./db.js";

export interface QueueEntry {
  userId: string;
  socketId: string;
  profile: PublicProfile;
  prefs: Prefs;
  since: number;
  /** socket to emit results to */
  emit: (event: string, payload?: unknown) => void;
}

const queue = new Map<string, QueueEntry>();
const sessions = new Map<string, { a: string; b: string; connectRequests: Set<string> }>();
const socketToUser = new Map<string, string>();

let pairingTimer: ReturnType<typeof setInterval> | null = null;
let onPair: ((entryA: QueueEntry, entryB: QueueEntry, matchA: LiveMatch, matchB: LiveMatch) => void) | null = null;

/* ================= scoring ================= */
function sharedInterests(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

export function computeScore(a: QueueEntry, b: QueueEntry) {
  const shared = sharedInterests(a.profile.interests, b.profile.interests);
  const sharedConv = sharedInterests(a.profile.conversationTypes, b.profile.conversationTypes);
  const lang = a.profile.languages.find((l) => b.profile.languages.includes(l)) ?? null;

  let score = 0;
  score += Math.min(shared.length, 3) * 20;
  score += lang ? 20 : 0;
  score += ageCompat(a, b) ? 15 : oneWayAge(a, b) || oneWayAge(b, a) ? 8 : 0;
  score += genderSatisfied(a.prefs.genderPref, b.profile.gender) ? 10 : 0;
  score += genderSatisfied(b.prefs.genderPref, a.profile.gender) ? 10 : 0;
  score += sharedConv.length > 0 ? 15 : 0;
  score += a.profile.country && a.profile.country === b.profile.country ? 10 : 0;

  return { score, shared, sharedConv, sharedLang: lang, pct: Math.min(99, Math.round((score / 140) * 100)) };
}

function oneWayAge(a: QueueEntry, b: QueueEntry): boolean {
  return a.prefs.agePref.includes(b.profile.age);
}
function ageCompat(a: QueueEntry, b: QueueEntry): boolean {
  return oneWayAge(a, b) && oneWayAge(b, a);
}
function genderSatisfied(pref: GenderPref, gender: Gender): boolean {
  if (pref === "anyone") return true;
  if (pref === "other") return gender === "nonbinary" || gender === "private";
  return pref === gender;
}

/** strictness level allowed after waiting `ms` in the queue */
function allowedLevel(ms: number): 1 | 2 | 3 | 4 | 5 {
  if (ms < 6_000) return 1;
  if (ms < 12_000) return 2;
  if (ms < 20_000) return 3;
  if (ms < 30_000) return 4;
  return 5;
}

function eligible(a: QueueEntry, b: QueueEntry, level: number): boolean {
  const { shared, sharedLang } = computeScore(a, b);
  const genderOk = genderSatisfied(a.prefs.genderPref, b.profile.gender);
  const ageOk = oneWayAge(a, b);
  switch (level) {
    case 1:
      return genderOk && ageOk && shared.length > 0 && sharedLang !== null && a.prefs.conversationTypes.some((t) => b.profile.conversationTypes.includes(t));
    case 2:
      return genderOk && shared.length > 0 && sharedLang !== null;
    case 3:
      return genderOk && (shared.length > 0 || sharedLang !== null);
    case 4:
      return sharedLang !== null || genderOk;
    default:
      return true;
  }
}

/* ================= queue management ================= */
export function joinQueue(entry: QueueEntry): void {
  leaveQueue(entry.userId);
  queue.set(entry.userId, entry);
  socketToUser.set(entry.socketId, entry.userId);
  tryPairNow(entry);
}

export function leaveQueue(userId: string): void {
  const e = queue.get(userId);
  if (e) socketToUser.delete(e.socketId);
  queue.delete(userId);
}

export function leaveBySocket(socketId: string): string | undefined {
  const userId = socketToUser.get(socketId);
  if (userId) leaveQueue(userId);
  return userId;
}

export function queueSize(): number {
  return queue.size;
}

export function activeSessionCount(): number {
  return sessions.size;
}

export function setPairHandler(fn: NonNullable<typeof onPair>): void {
  onPair = fn;
}

function tryPairNow(fresh: QueueEntry): void {
  let best: { entry: QueueEntry; matchA: LiveMatch; matchB: LiveMatch; score: number } | null = null;
  const level = allowedLevel(Date.now() - fresh.since);

  for (const cand of queue.values()) {
    if (cand.userId === fresh.userId) continue;
    if (db.isBlockedEither(fresh.userId, cand.userId)) continue;
    const candLevel = Math.max(level, allowedLevel(Date.now() - cand.since));
    if (!eligible(fresh, cand, candLevel) || !eligible(cand, fresh, candLevel)) continue;
    const r = computeScore(fresh, cand);
    if (!best || r.score > best.score) {
      best = { entry: cand, score: r.score, ...buildMatches(fresh, cand, candLevel) };
    }
  }
  if (best) finalizePair(fresh, best.entry, best.matchA, best.matchB);
}

function buildMatches(a: QueueEntry, b: QueueEntry, level: number) {
  const r = computeScore(a, b);
  const sessionId = randomUUID();
  const matchA: LiveMatch = { sessionId, peer: publicOf(b), shared: r.shared, sharedConv: r.sharedConv, sharedLang: r.sharedLang, score: r.score, pct: r.pct, level: level as LiveMatch["level"] };
  const matchB: LiveMatch = { ...matchA, peer: publicOf(a) };
  return { matchA, matchB };
}

function publicOf(e: QueueEntry): PublicProfile {
  // never leak queue internals — only the public profile crosses the wire
  return { ...e.profile };
}

function finalizePair(a: QueueEntry, b: QueueEntry, matchA: LiveMatch, matchB: LiveMatch): void {
  queue.delete(a.userId);
  queue.delete(b.userId);
  socketToUser.delete(a.socketId);
  socketToUser.delete(b.socketId);
  sessions.set(matchA.sessionId, { a: a.userId, b: b.userId, connectRequests: new Set() });
  db.createSession(matchA.sessionId, a.userId, b.userId, matchA.level, matchA.score);
  onPair?.(a, b, matchA, matchB);
}

/** periodic sweep: longest-waiting users get paired first */
function pairingPass(): void {
  const waiters = [...queue.values()].sort((x, y) => x.since - y.since);
  const used = new Set<string>();

  for (const a of waiters) {
    if (used.has(a.userId)) continue;
    const level = allowedLevel(Date.now() - a.since);
    let best: { entry: QueueEntry; score: number } | null = null;

    for (const b of waiters) {
      if (b.userId === a.userId || used.has(b.userId)) continue;
      if (db.isBlockedEither(a.userId, b.userId)) continue;
      const bLevel = allowedLevel(Date.now() - b.since);
      const lvl = Math.max(level, bLevel);
      if (!eligible(a, b, lvl) || !eligible(b, a, lvl)) continue;
      const { score } = computeScore(a, b);
      if (!best || score > best.score) best = { entry: b, score };
    }

    if (best) {
      used.add(a.userId);
      used.add(best.entry.userId);
      const lvl = Math.max(level, allowedLevel(Date.now() - best.entry.since));
      const { matchA, matchB } = buildMatches(a, best.entry, lvl);
      finalizePair(a, best.entry, matchA, matchB);
    }
  }
}

export function startPairingLoop(): void {
  if (pairingTimer) return;
  pairingTimer = setInterval(pairingPass, PAIRING_INTERVAL_MS);
  pairingTimer.unref?.();
}

/* ================= chat sessions ================= */
export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

export function requestConnect(sessionId: string, userId: string): boolean {
  const s = sessions.get(sessionId);
  if (!s) return false;
  s.connectRequests.add(userId);
  if (s.connectRequests.has(s.a) && s.connectRequests.has(s.b)) {
    db.connectUsers(s.a, s.b);
    return true; // mutual!
  }
  return false;
}

export function endChat(sessionId: string, reason: string): void {
  if (sessions.delete(sessionId)) db.endSession(sessionId, reason);
}

export function userInSession(userId: string): string | undefined {
  for (const [id, s] of sessions) if (s.a === userId || s.b === userId) return id;
  return undefined;
}
