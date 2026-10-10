// Idempotent schema creation for both dialects (no migration tool needed at runtime).

const TABLES = (ms: string, q = "") => [
  `CREATE TABLE IF NOT EXISTS ${q}devices (id TEXT PRIMARY KEY, created_at ${ms} NOT NULL, last_seen ${ms} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ${q}push_subscriptions (device_id TEXT PRIMARY KEY, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, neutral INTEGER NOT NULL DEFAULT 0, updated_at ${ms} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ${q}push_schedule (id TEXT PRIMARY KEY, device_id TEXT NOT NULL, at ${ms} NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, sent_at ${ms})`,
  `CREATE INDEX IF NOT EXISTS push_schedule_due ON ${q}push_schedule (sent_at, at)`,
  `CREATE INDEX IF NOT EXISTS push_schedule_device ON ${q}push_schedule (device_id)`,
  `CREATE TABLE IF NOT EXISTS ${q}lines (id TEXT PRIMARY KEY, text TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL, source TEXT NOT NULL, factual INTEGER NOT NULL DEFAULT 0, up INTEGER NOT NULL DEFAULT 0, down INTEGER NOT NULL DEFAULT 0, created_at ${ms} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ${q}principles (id TEXT PRIMARY KEY, text TEXT NOT NULL, status TEXT NOT NULL, source TEXT NOT NULL, factual INTEGER NOT NULL DEFAULT 0, created_at ${ms} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ${q}votes (device_id TEXT NOT NULL, kind TEXT NOT NULL, target_id TEXT NOT NULL, vote INTEGER NOT NULL, topic TEXT, created_at ${ms} NOT NULL, PRIMARY KEY (device_id, kind, target_id))`,
  `CREATE TABLE IF NOT EXISTS ${q}reports (id TEXT PRIMARY KEY, answer_id TEXT NOT NULL, text TEXT NOT NULL, topic TEXT, status TEXT NOT NULL, created_at ${ms} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ${q}topics (id TEXT PRIMARY KEY, topic TEXT NOT NULL, day TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS topics_day ON ${q}topics (day)`,
  `CREATE TABLE IF NOT EXISTS ${q}chat_usage (device_id TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (device_id, day))`,
  `CREATE TABLE IF NOT EXISTS ${q}job_runs (id TEXT PRIMARY KEY, started_at ${ms} NOT NULL, summary TEXT NOT NULL)`,
];

// Postgres: own schema "cyclemax" (see schema-pg.ts) – safe next to other apps in the same Neon database.
export const PG_DDL = [`CREATE SCHEMA IF NOT EXISTS cyclemax`, ...TABLES("BIGINT", "cyclemax.")];
export const SQLITE_DDL = TABLES("INTEGER");
