// Postgres (Neon) schema. Must mirror schema-sqlite.ts column for column.
// All tables live in their own Postgres schema "cyclemax", so the app can share a Neon database with other apps.
import { bigint, integer, pgSchema, primaryKey, text } from "drizzle-orm/pg-core";

export const PG_SCHEMA = "cyclemax";
const cm = pgSchema(PG_SCHEMA);

const ms = (name: string) => bigint(name, { mode: "number" });

export const devices = cm.table("devices", {
  id: text("id").primaryKey(),
  createdAt: ms("created_at").notNull(),
  lastSeen: ms("last_seen").notNull(),
});

export const pushSubscriptions = cm.table("push_subscriptions", {
  deviceId: text("device_id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  neutral: integer("neutral").notNull().default(0),
  updatedAt: ms("updated_at").notNull(),
});

export const pushSchedule = cm.table("push_schedule", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  at: ms("at").notNull(),
  kind: text("kind").notNull(),
  key: text("key").notNull(),
  sentAt: ms("sent_at"),
});

export const lines = cm.table("lines", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  factual: integer("factual").notNull().default(0),
  up: integer("up").notNull().default(0),
  down: integer("down").notNull().default(0),
  createdAt: ms("created_at").notNull(),
});

export const principles = cm.table("principles", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  factual: integer("factual").notNull().default(0),
  createdAt: ms("created_at").notNull(),
});

export const votes = cm.table(
  "votes",
  {
    deviceId: text("device_id").notNull(),
    kind: text("kind").notNull(),
    targetId: text("target_id").notNull(),
    vote: integer("vote").notNull(),
    topic: text("topic"),
    createdAt: ms("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.deviceId, t.kind, t.targetId] })],
);

export const reports = cm.table("reports", {
  id: text("id").primaryKey(),
  answerId: text("answer_id").notNull(),
  text: text("text").notNull(),
  topic: text("topic"),
  status: text("status").notNull(),
  createdAt: ms("created_at").notNull(),
});

export const topics = cm.table("topics", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  day: text("day").notNull(),
});

export const chatUsage = cm.table(
  "chat_usage",
  {
    deviceId: text("device_id").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.deviceId, t.day] })],
);

export const jobRuns = cm.table("job_runs", {
  id: text("id").primaryKey(),
  startedAt: ms("started_at").notNull(),
  summary: text("summary").notNull(),
});
