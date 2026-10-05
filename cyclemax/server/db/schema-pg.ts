// Postgres (Neon) schema. Must mirror schema-sqlite.ts column for column.
import { bigint, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

const ms = (name: string) => bigint(name, { mode: "number" });

export const devices = pgTable("devices", {
  id: text("id").primaryKey(),
  createdAt: ms("created_at").notNull(),
  lastSeen: ms("last_seen").notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  deviceId: text("device_id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  neutral: integer("neutral").notNull().default(0),
  updatedAt: ms("updated_at").notNull(),
});

export const pushSchedule = pgTable("push_schedule", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  at: ms("at").notNull(),
  kind: text("kind").notNull(),
  key: text("key").notNull(),
  sentAt: ms("sent_at"),
});

export const lines = pgTable("lines", {
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

export const principles = pgTable("principles", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  factual: integer("factual").notNull().default(0),
  createdAt: ms("created_at").notNull(),
});

export const votes = pgTable(
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

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  answerId: text("answer_id").notNull(),
  text: text("text").notNull(),
  topic: text("topic"),
  status: text("status").notNull(),
  createdAt: ms("created_at").notNull(),
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  day: text("day").notNull(),
});

export const chatUsage = pgTable(
  "chat_usage",
  {
    deviceId: text("device_id").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.deviceId, t.day] })],
);

export const jobRuns = pgTable("job_runs", {
  id: text("id").primaryKey(),
  startedAt: ms("started_at").notNull(),
  summary: text("summary").notNull(),
});
