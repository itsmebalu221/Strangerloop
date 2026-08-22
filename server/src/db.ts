/**
 * Persistence layer — SQLite (better-sqlite3) in WAL mode.
 * Zero-config: creates ./strangrloop.db on first run.
 * Swap for Postgres later by reimplementing this module; the rest of the
 * server only talks to these functions.
 */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DB_PATH } from "./config.js";
import type { AgeRange, Gender, Prefs, PublicProfile } from "./config.js";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  gender        TEXT NOT NULL DEFAULT 'private',
  age_range     TEXT NOT NULL DEFAULT '25–34',
  country       TEXT NOT NULL DEFAULT '',
  languages     TEXT NOT NULL DEFAULT '["English"]',
  interests     TEXT NOT NULL DEFAULT '[]',
  conv_types    TEXT NOT NULL DEFAULT '["casual"]',
  bio           TEXT NOT NULL DEFAULT '',
  prefs         TEXT NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'active',   -- active | warned | restricted | banned
  risk_score    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id          TEXT PRIMARY KEY,
  user_a      TEXT NOT NULL,
  user_b      TEXT NOT NULL,
  started_at  INTEGER NOT NULL,
  ended_at    INTEGER,
  end_reason  TEXT,                                -- next | leave | report | block | disconnect
  match_level INTEGER NOT NULL DEFAULT 5,
  score       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON chat_sessions(started_at);

CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  sender_id   TEXT NOT NULL,
  body        TEXT NOT NULL,
  risk        TEXT NOT NULL DEFAULT 'low',         -- low | suspicious | high | severe
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

CREATE TABLE IF NOT EXISTS connections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a      TEXT NOT NULL,
  user_b      TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  UNIQUE(user_a, user_b)
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker     TEXT NOT NULL,
  blocked     TEXT NOT NULL,
  reason      TEXT NOT NULL DEFAULT 'blocked',
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (blocker, blocked)
);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter    TEXT NOT NULL,
  reported    TEXT NOT NULL,
  reason      TEXT NOT NULL,
  details     TEXT NOT NULL DEFAULT '',
  severity    TEXT NOT NULL DEFAULT 'high',
  status      TEXT NOT NULL DEFAULT 'open',        -- open | dismissed | warned | suspended | banned
  session_id  TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,                       -- warn | block_message | restrict | flood
  category    TEXT NOT NULL DEFAULT '',
  detail      TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL
);
`);

/* ================= prepared statements ================= */
const stmt = {
  upsertUser: db.prepare(`
    INSERT INTO users (id, display_name, created_at)
    VALUES (@id, @name, @now)
    ON CONFLICT(id) DO NOTHING
  `),
  getUser: db.prepare(`SELECT * FROM users WHERE id = ?`),
  saveProfile: db.prepare(`
    UPDATE users SET display_name = @name, gender = @gender, age_range = @age,
      country = @country, languages = @languages, interests = @interests,
      conv_types = @conv, bio = @bio
    WHERE id = @id
  `),
  savePrefs: db.prepare(`UPDATE users SET prefs = @prefs WHERE id = @id`),
  setStatus: db.prepare(`UPDATE users SET status = ? WHERE id = ?`),
  addRisk: db.prepare(`UPDATE users SET risk_score = risk_score + ? WHERE id = ?`),

  insertSession: db.prepare(`
    INSERT INTO chat_sessions (id, user_a, user_b, started_at, match_level, score)
    VALUES (@id, @a, @b, @now, @level, @score)
  `),
  endSession: db.prepare(`UPDATE chat_sessions SET ended_at = @now, end_reason = @reason WHERE id = @id`),
  insertMessage: db.prepare(`
    INSERT INTO messages (session_id, sender_id, body, risk, created_at) VALUES (@sid, @sender, @body, @risk, @now)
  `),
  sessionContext: db.prepare(`
    SELECT sender_id, body, risk, created_at FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 20
  `),
  matchedToday: db.prepare(`
    SELECT COUNT(*) AS n FROM chat_sessions WHERE started_at >= ?
  `),

  insertConnection: db.prepare(`
    INSERT OR IGNORE INTO connections (user_a, user_b, created_at) VALUES (@a, @b, @now)
  `),
  listConnections: db.prepare(`
    SELECT c.id, c.created_at,
      CASE WHEN c.user_a = ? THEN c.user_b ELSE c.user_a END AS peer_id
    FROM connections c WHERE c.user_a = ? OR c.user_b = ? ORDER BY c.created_at DESC
  `),
  removeConnection: db.prepare(`DELETE FROM connections WHERE id = ? AND (user_a = ? OR user_b = ?)`),

  insertBlock: db.prepare(`
    INSERT OR IGNORE INTO blocks (blocker, blocked, reason, created_at) VALUES (@blocker, @blocked, @reason, @now)
  `),
  removeBlock: db.prepare(`DELETE FROM blocks WHERE blocker = ? AND blocked = ?`),
  listBlocks: db.prepare(`SELECT blocked, reason, created_at FROM blocks WHERE blocker = ? ORDER BY created_at DESC`),
  isBlocked: db.prepare(`SELECT 1 FROM blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?) LIMIT 1`),

  insertReport: db.prepare(`
    INSERT INTO reports (reporter, reported, reason, details, severity, session_id, created_at)
    VALUES (@reporter, @reported, @reason, @details, @severity, @session, @now)
  `),
  listReports: db.prepare(`
    SELECT r.*, u.display_name AS reported_name FROM reports r
    LEFT JOIN users u ON u.id = r.reported ORDER BY r.created_at DESC LIMIT 200
  `),
  setReportStatus: db.prepare(`UPDATE reports SET status = ? WHERE id = ?`),
  searchUsers: db.prepare(`SELECT id, display_name, status, risk_score, created_at FROM users WHERE display_name LIKE ? LIMIT 50`),

  insertModEvent: db.prepare(`
    INSERT INTO moderation_events (user_id, kind, category, detail, created_at) VALUES (@user, @kind, @cat, @detail, @now)
  `),
};

/* ================= typed API ================= */
export interface UserRow {
  id: string;
  display_name: string;
  gender: Gender;
  age_range: AgeRange;
  country: string;
  languages: string;
  interests: string;
  conv_types: string;
  bio: string;
  prefs: string;
  status: string;
  risk_score: number;
  created_at: number;
}

function parseList(v: string): string[] {
  try {
    return JSON.parse(v) as string[];
  } catch {
    return [];
  }
}

export function ensureUser(id: string, name: string): void {
  stmt.upsertUser.run({ id, name, now: Date.now() });
}

export function getUser(id: string): UserRow | undefined {
  return stmt.getUser.get(id) as UserRow | undefined;
}

export function toPublic(row: UserRow): PublicProfile {
  return {
    id: row.id,
    name: row.display_name,
    gender: row.gender,
    age: row.age_range,
    country: row.country,
    languages: parseList(row.languages),
    interests: parseList(row.interests),
    conversationTypes: parseList(row.conv_types),
    bio: row.bio,
  };
}

export function getPrefs(row: UserRow): Prefs | null {
  try {
    const p = JSON.parse(row.prefs) as Prefs;
    return p && Array.isArray(p.agePref) ? p : null;
  } catch {
    return null;
  }
}

export function saveProfile(id: string, p: PublicProfile): void {
  stmt.saveProfile.run({
    id,
    name: p.name,
    gender: p.gender,
    age: p.age,
    country: p.country,
    languages: JSON.stringify(p.languages),
    interests: JSON.stringify(p.interests),
    conv: JSON.stringify(p.conversationTypes),
    bio: p.bio,
  });
}

export function savePrefs(id: string, prefs: Prefs): void {
  stmt.savePrefs.run({ id, prefs: JSON.stringify(prefs) });
}

export function setUserStatus(id: string, status: string): void {
  stmt.setStatus.run(status, id);
}

export function addRisk(id: string, n: number): void {
  stmt.addRisk.run(n, id);
}

export function createSession(id: string, a: string, b: string, level: number, score: number): void {
  stmt.insertSession.run({ id, a, b, now: Date.now(), level, score });
}

export function endSession(id: string, reason: string): void {
  stmt.endSession.run({ id, now: Date.now(), reason });
}

export function logMessage(sid: string, sender: string, body: string, risk: string): void {
  stmt.insertMessage.run({ sid, sender, body, risk, now: Date.now() });
}

export function sessionContext(sid: string): { sender_id: string; body: string; risk: string; created_at: number }[] {
  return stmt.sessionContext.all(sid) as never[];
}

export function matchedToday(): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return (stmt.matchedToday.get(start.getTime()) as { n: number }).n;
}

export function connectUsers(a: string, b: string): void {
  const [x, y] = a < b ? [a, b] : [b, a];
  stmt.insertConnection.run({ a: x, b: y, now: Date.now() });
}

export function listConnections(userId: string) {
  const rows = stmt.listConnections.all(userId, userId, userId) as { id: number; created_at: number; peer_id: string }[];
  return rows.map((r) => {
    const peer = getUser(r.peer_id);
    return { id: r.id, createdAt: r.created_at, peer: peer ? toPublic(peer) : { id: r.peer_id, name: "former user" } };
  });
}

export function removeConnection(id: number, userId: string): void {
  stmt.removeConnection.run(id, userId, userId);
}

export function blockUser(blocker: string, blocked: string, reason: string): void {
  stmt.insertBlock.run({ blocker, blocked, reason, now: Date.now() });
}

export function unblockUser(blocker: string, blocked: string): void {
  stmt.removeBlock.run(blocker, blocked);
}

export function listBlocks(userId: string) {
  return stmt.listBlocks.all(userId) as { blocked: string; reason: string; created_at: number }[];
}

export function isBlockedEither(a: string, b: string): boolean {
  return Boolean(stmt.isBlocked.get(a, b, b, a));
}

export function insertReport(r: { reporter: string; reported: string; reason: string; details: string; severity: string; session: string | null }): number {
  const info = stmt.insertReport.run({ ...r, now: Date.now() });
  return Number(info.lastInsertRowid);
}

export function listReports() {
  return stmt.listReports.all() as never[];
}

export function setReportStatus(id: number, status: string): void {
  stmt.setReportStatus.run(status, id);
}

export function searchUsers(q: string) {
  return stmt.searchUsers.all(`%${q}%`) as never[];
}

export function logModEvent(user: string, kind: string, category: string, detail: string): void {
  stmt.insertModEvent.run({ user, kind, cat: category, detail, now: Date.now() });
}
