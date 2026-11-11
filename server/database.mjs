import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  ADJUSTMENTS,
  AUDIT,
  CANDIDATES,
  CYCLE,
  DEMO_PASSWORD,
  INTERVIEWS,
  OFFERS,
  UNITS,
  USERS,
} from "./seed-data.mjs";

const serverDir = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.TONGLU_DB ?? join(serverDir, "..", "data", "tonglu.db");

mkdirSync(dirname(DB_PATH), { recursive: true });
export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    account TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    unit_id TEXT,
    student_no TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cycle (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    college TEXT NOT NULL,
    timezone TEXT NOT NULL,
    stage TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    frozen_at TEXT,
    supplement_round INTEGER NOT NULL DEFAULT 0,
    supplement_generated_at TEXT,
    candidate_list_submitted INTEGER NOT NULL DEFAULT 0,
    publication_version INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    direction TEXT NOT NULL,
    mentor TEXT NOT NULL,
    mentor_title TEXT NOT NULL,
    quota INTEGER NOT NULL,
    base_confirmed INTEGER NOT NULL,
    base_pending INTEGER NOT NULL,
    location TEXT NOT NULL,
    schedule TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    version INTEGER NOT NULL,
    round INTEGER NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    selected_units TEXT NOT NULL,
    adjustments TEXT NOT NULL,
    commitment INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS application_drafts (
    student_id TEXT PRIMARY KEY,
    selected_units TEXT NOT NULL,
    adjustments TEXT NOT NULL,
    commitment INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    status TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    deadline TEXT NOT NULL,
    score INTEGER NOT NULL,
    note TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    date_label TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    interviewer TEXT NOT NULL,
    status TEXT NOT NULL,
    score INTEGER
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    name TEXT NOT NULL,
    student_no TEXT NOT NULL,
    major TEXT NOT NULL,
    interview_at TEXT NOT NULL,
    score INTEGER,
    comment TEXT NOT NULL DEFAULT '',
    decision TEXT
  );

  CREATE TABLE IF NOT EXISTS adjustments (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_no TEXT NOT NULL,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    priority INTEGER NOT NULL,
    authorized INTEGER NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS supplements (
    id TEXT PRIMARY KEY,
    round INTEGER NOT NULL,
    generated_at TEXT NOT NULL,
    note TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appeals (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS publications (
    id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    published_at TEXT NOT NULL,
    frozen_at TEXT,
    snapshot_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE NOT NULL,
    at TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    object TEXT NOT NULL,
    detail TEXT NOT NULL
  );
`);

export function nowIso() {
  return new Date().toISOString();
}

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

function seedBusinessData() {
  db.exec("DELETE FROM applications; DELETE FROM application_drafts; DELETE FROM offers; DELETE FROM interviews; DELETE FROM candidates; DELETE FROM adjustments; DELETE FROM supplements; DELETE FROM appeals; DELETE FROM publications; DELETE FROM audit_logs; DELETE FROM units; DELETE FROM cycle;");

  db.prepare(`
    INSERT INTO cycle (id, name, code, college, timezone, stage)
    VALUES (1, ?, ?, ?, ?, 'offer')
  `).run(CYCLE.name, CYCLE.code, CYCLE.college, CYCLE.timezone);

  const insertUnit = db.prepare(`
    INSERT INTO units (id, code, name, direction, mentor, mentor_title, quota, base_confirmed, base_pending, location, schedule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const unit of UNITS) {
    insertUnit.run(unit.id, unit.code, unit.name, unit.direction, unit.mentor, unit.mentorTitle, unit.quota, unit.confirmed, unit.pending, unit.location, unit.schedule);
  }

  db.prepare(`
    INSERT INTO applications (id, student_id, submitted_at, version, round, idempotency_key, selected_units, adjustments, commitment)
    VALUES ('app-2026-aut-sy-v1', 'stu-sy', '2026-11-02T09:42:00+08:00', 1, 1, '2026-AUT-stu-sy-v1', ?, ?, 1)
  `).run(JSON.stringify(["u1", "u2", "u3"]), JSON.stringify({ internal: true, cross: false }));

  db.prepare(`
    INSERT INTO application_drafts (student_id, selected_units, adjustments, commitment, updated_at)
    VALUES ('stu-sy', ?, ?, 1, ?)
  `).run(JSON.stringify(["u1", "u2", "u3"]), JSON.stringify({ internal: true, cross: false }), nowIso());

  const insertOffer = db.prepare(`
    INSERT INTO offers (id, student_id, unit_id, status, issued_at, deadline, score, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const offer of OFFERS) {
    insertOffer.run(offer.id, offer.studentId, offer.unitId, offer.status, offer.issuedAt, offer.deadline, offer.score, offer.note);
  }

  const insertInterview = db.prepare(`
    INSERT INTO interviews (id, student_id, unit_id, date_label, time, location, interviewer, status, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const interview of INTERVIEWS) {
    insertInterview.run(interview.id, interview.studentId, interview.unitId, interview.dateLabel, interview.time, interview.location, interview.interviewer, interview.status, interview.score);
  }

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (id, unit_id, name, student_no, major, interview_at, score, comment, decision)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const candidate of CANDIDATES) {
    insertCandidate.run(candidate.id, candidate.unitId, candidate.name, candidate.studentNo, candidate.major, candidate.interviewAt, candidate.score, candidate.comment, candidate.decision);
  }

  const insertAdjustment = db.prepare(`
    INSERT INTO adjustments (id, student_name, student_no, source, target, priority, authorized, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of ADJUSTMENTS) {
    insertAdjustment.run(item.id, item.studentName, item.studentNo, item.source, item.target, item.priority, item.authorized, item.status, item.note);
  }

  for (const event of AUDIT) {
    appendAudit(event.actor, event.action, event.object, event.detail, event.at, event.id);
  }
}

export function initializeDatabase() {
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, account, password_hash, name, role, unit_id, student_no, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const user of USERS) {
      insertUser.run(user.id, user.account, hashPassword(DEMO_PASSWORD), user.name, user.role, user.unitId, user.studentNo, nowIso());
    }
  }
  const cycleCount = db.prepare("SELECT COUNT(*) AS count FROM cycle").get().count;
  if (cycleCount === 0) seedBusinessData();
}

export function resetBusinessData() {
  db.exec("BEGIN IMMEDIATE");
  try {
    seedBusinessData();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    account: row.account,
    name: row.name,
    role: row.role,
    unitId: row.unit_id ?? null,
    studentNo: row.student_no ?? null,
    active: Boolean(row.active),
  };
}

export function findUserByAccount(account) {
  return db.prepare("SELECT * FROM users WHERE account = ? AND active = 1").get(account) ?? null;
}

export function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) ?? null;
}

export function login(account, password) {
  const user = findUserByAccount(account);
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  const token = randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(token, user.id, createdAt, expiresAt);
  return { token, user: sanitizeUser(user) };
}

export function getSessionUser(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT users.*, sessions.expires_at AS session_expires_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND users.active = 1
  `).get(token);
  if (!row) return null;
  if (new Date(row.session_expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return sanitizeUser(row);
}

export function logout(token) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function appendAudit(actor, action, object, detail, at = nowIso(), id = randomUUID()) {
  db.prepare(`
    INSERT INTO audit_logs (id, at, actor, action, object, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, at, actor, action, object, detail);
}

export function transaction(work) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

initializeDatabase();
