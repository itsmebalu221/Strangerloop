/**
 * Automated moderation + anti-abuse.
 *
 * Every outgoing chat message passes through `moderate()`:
 *   low        → relay
 *   suspicious → relay, but flag + warn the sender once per category
 *   high       → block the message, log an incident, +risk
 *   severe     → block, end the session, restrict the account, escalate
 *
 * Humans still decide: everything lands in `reports` / `moderation_events`
 * for the admin dashboard. Severe categories follow escalation policy.
 */
import { MESSAGE_BURST_CAPACITY, MESSAGE_BURST_REFILL_PER_SEC, MAX_MESSAGE_LENGTH } from "./config.js";
import * as db from "./db.js";

export type Risk = "low" | "suspicious" | "high" | "severe";

interface Rule {
  category: string;
  risk: Risk;
  pattern: RegExp;
}

/* Pattern lists are intentionally conservative; extend from the admin side. */
const RULES: Rule[] = [
  // severe — escalate immediately
  { category: "csam", risk: "severe", pattern: /\b(?:underage|minor|child|kid|teen(?:ager)?)\s+(?:porn|nude|cam|video|pics?)\b/i },
  { category: "threats", risk: "severe", pattern: /\b(?:kill you|i'?ll find you|swat you|bomb |hurt you badly)\b/i },

  // high — block the message
  { category: "scam", risk: "high", pattern: /\b(?:double your (?:money|crypto)|guaranteed returns|gift ?card|cash ?app|pay ?pal me|send (?:me )?(?:bitcoin|crypto|usdt)|western union|money gram)\b/i },
  { category: "explicit", risk: "high", pattern: /\b(?:onlyfans|fansly|sex ?cam|cam ?girl|nude ?chat|send (?:me )?nudes?|cyber ?sex)\b/i },
  { category: "personal-info", risk: "high", pattern: /(?:\+?\d[\d\s\-().]{8,}\d)|(?:\b(?:whats|what'?s) your (?:number|phone|address|email)\b)|(?:send (?:me )?your (?:address|location|pics?))|(?:(?:google )?hangouts|telegram|whatsapp)\s+(?:me|id|user)/i },
  { category: "hate", risk: "high", pattern: /\b(?:kys|kill yourself)\b|\b(?:fag|faggot|tranny|wetback|sand ?nigger|coon)\b/i },

  // suspicious — allow but flag
  { category: "harassment", risk: "suspicious", pattern: /\b(?:stupid|loser|shut up|ugly|fat|worthless|pathetic)\b/i },
  { category: "links", risk: "suspicious", pattern: /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(?:com|net|org|io|in|xyz|top|click)\b/i },
  { category: "solicitation", risk: "suspicious", pattern: /\b(?:invest|earn (?:\$|money|from home)|work from home|dm me for|promo code|discount code|followers cheap)\b/i },
];

export interface Verdict {
  risk: Risk;
  category: string;
  reason: string;
}

const warnedOnce = new Map<string, Set<string>>(); // userId → categories already warned

export function moderate(userId: string, rawBody: string): { verdict: Verdict; body: string } {
  const body = rawBody.slice(0, MAX_MESSAGE_LENGTH);

  // structural spam signals
  const stripped = body.trim();
  if (!stripped) return { verdict: { risk: "low", category: "", reason: "" }, body };

  const capsRatio = stripped.length > 20 ? (stripped.replace(/[^A-Z]/g, "").length / stripped.replace(/[^a-zA-Z]/g, "").length || 0) : 0;
  if (capsRatio > 0.7 && stripped.length > 25) {
    return flagged(userId, { risk: "suspicious", category: "spam", reason: "excessive caps" }, body);
  }

  for (const rule of RULES) {
    if (rule.pattern.test(stripped)) {
      return flagged(userId, { risk: rule.risk, category: rule.category, reason: "pattern match" }, body);
    }
  }

  // repeated-message flood detection
  const repeat = recentBodies.get(userId) ?? [];
  const dupes = repeat.filter((b) => b === stripped).length;
  if (dupes >= 2) {
    return flagged(userId, { risk: "suspicious", category: "spam", reason: "repeated message" }, body);
  }

  return { verdict: { risk: "low", category: "", reason: "" }, body };
}

function flagged(userId: string, verdict: Verdict, body: string) {
  if (verdict.risk === "suspicious") {
    const seen = warnedOnce.get(userId) ?? new Set<string>();
    if (!seen.has(verdict.category)) {
      seen.add(verdict.category);
      warnedOnce.set(userId, seen);
      verdict.reason += "|warn-user";
    }
    db.logModEvent(userId, "warn", verdict.category, verdict.reason);
    db.addRisk(userId, 2);
  } else if (verdict.risk === "high") {
    db.logModEvent(userId, "block_message", verdict.category, verdict.reason);
    db.addRisk(userId, 8);
  } else if (verdict.risk === "severe") {
    db.logModEvent(userId, "restrict", verdict.category, verdict.reason);
    db.addRisk(userId, 25);
    db.setUserStatus(userId, "restricted");
  }
  return { verdict, body };
}

const recentBodies = new Map<string, string[]>();
export function trackBody(userId: string, body: string): void {
  const list = recentBodies.get(userId) ?? [];
  list.push(body);
  recentBodies.set(userId, list.slice(-5));
}

/* ================= anti-abuse: token bucket + flood guard ================= */
interface Bucket {
  tokens: number;
  updated: number;
  joinTimes: number[];
}

const buckets = new Map<string, Bucket>();
const lastFloodLog = new Map<string, number>();
const FLOOD_LOG_COOLDOWN_MS = 30_000;
const BUCKET_TTL_MS = 10 * 60_000;

/** true = allowed */
export function consumeMessageToken(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: MESSAGE_BURST_CAPACITY, updated: now, joinTimes: [] };
  b.tokens = Math.min(MESSAGE_BURST_CAPACITY, b.tokens + ((now - b.updated) / 1000) * MESSAGE_BURST_REFILL_PER_SEC);
  b.updated = now;
  buckets.set(key, b);
  if (b.tokens < 1) {
    // one DB row per offender per cooldown window, not per blocked message
    const last = lastFloodLog.get(key) ?? 0;
    if (now - last > FLOOD_LOG_COOLDOWN_MS) {
      lastFloodLog.set(key, now);
      db.logModEvent(key, "flood", "rate-limit", "message burst exceeded");
    }
    return false;
  }
  b.tokens -= 1;
  return true;
}

/** max 3 queue joins per minute per user */
export function canJoinQueue(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: MESSAGE_BURST_CAPACITY, updated: now, joinTimes: [] };
  b.joinTimes = b.joinTimes.filter((t) => now - t < 60_000);
  b.updated = now;
  buckets.set(key, b);
  if (b.joinTimes.length >= 3) return false;
  b.joinTimes.push(now);
  return true;
}

/**
 * Janitor — prunes idle state so long-running processes don't leak memory:
 * buckets/repeat-buffers unused for 10 min, warn-once sets capped at 10k users.
 */
let janitorTimer: ReturnType<typeof setInterval> | null = null;

function sweep(): void {
  const cutoff = Date.now() - BUCKET_TTL_MS;
  for (const [key, b] of buckets) {
    if (b.updated < cutoff) buckets.delete(key);
  }
  for (const key of recentBodies.keys()) {
    if (!buckets.has(key)) recentBodies.delete(key);
  }
  if (warnedOnce.size > 10_000) warnedOnce.clear();
  if (lastFloodLog.size > 10_000) lastFloodLog.clear();
}

export function startModerationJanitor(): void {
  if (janitorTimer) return;
  janitorTimer = setInterval(sweep, 5 * 60_000);
  janitorTimer.unref?.();
}

export function stopModerationJanitor(): void {
  if (janitorTimer) clearInterval(janitorTimer);
  janitorTimer = null;
}

/** account-level gate: restricted/banned users can't match */
export function accountAllowed(userId: string): { ok: boolean; reason?: string } {
  const row = db.getUser(userId);
  if (!row) return { ok: true };
  if (row.status === "banned") return { ok: false, reason: "This account is banned." };
  if (row.status === "restricted") return { ok: false, reason: "This account is temporarily restricted pending review." };
  if (row.risk_score >= 60) return { ok: false, reason: "Too many flags — matching is paused while we review." };
  return { ok: true };
}
