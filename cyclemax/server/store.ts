// Repository: every database access of the backend lives here.
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { SEED_LINES, SEED_PRINCIPLES } from "../shared/knowledge.generated";
import type { Line, LineCategory, ScheduledItem } from "../shared/types";
import type { Database } from "./db";

export type LineStatus = "live" | "review" | "disabled";
export type ContentSource = "seed" | "generated" | "admin";

export interface LineRow {
  id: string;
  text: string;
  category: LineCategory;
  status: LineStatus;
  source: ContentSource;
  factual: number;
  up: number;
  down: number;
  createdAt: number;
}

export interface PrincipleRow {
  id: string;
  text: string;
  status: LineStatus;
  source: ContentSource;
  factual: number;
  createdAt: number;
}

export interface DueItem {
  id: string;
  deviceId: string;
  at: number;
  kind: string;
  key: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  neutral: number;
}

/** After this many negative votes a line is deactivated. */
export const DISABLE_AFTER_DOWNVOTES = 5;
export const CHAT_DAILY_LIMIT = 40;

export function lineWeight(up: number, down: number): number {
  return Math.min(3, Math.max(0.3, 1 + (up - down) * 0.2));
}

const uuid = () => crypto.randomUUID();
const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function createStore(database: Database) {
  const { db, t } = database;

  return {
    kind: database.kind,

    async seed(now = Date.now()) {
      const lineRows = SEED_LINES.map((l) => ({
        id: l.id,
        text: l.text,
        category: l.category,
        status: "live",
        source: "seed",
        factual: 0,
        up: 0,
        down: 0,
        createdAt: now,
      }));
      for (let i = 0; i < lineRows.length; i += 50)
        await db.insert(t.lines).values(lineRows.slice(i, i + 50)).onConflictDoNothing();
      const principleRows = SEED_PRINCIPLES.map((text, i) => ({
        id: `p-seed-${i}`,
        text,
        status: "live",
        source: "seed",
        factual: 0,
        createdAt: now,
      }));
      await db.insert(t.principles).values(principleRows).onConflictDoNothing();
    },

    async touchDevice(deviceId: string, now = Date.now()) {
      await db
        .insert(t.devices)
        .values({ id: deviceId, createdAt: now, lastSeen: now })
        .onConflictDoUpdate({ target: t.devices.id, set: { lastSeen: now } });
    },

    // ------------------------------------------------------------ push
    async saveSchedule(
      deviceId: string,
      sub: { endpoint: string; p256dh: string; auth: string },
      neutral: boolean,
      items: ScheduledItem[],
      now = Date.now(),
    ) {
      await this.touchDevice(deviceId, now);
      const subRow = { ...sub, neutral: neutral ? 1 : 0, updatedAt: now };
      await db
        .insert(t.pushSubscriptions)
        .values({ deviceId, ...subRow })
        .onConflictDoUpdate({ target: t.pushSubscriptions.deviceId, set: subRow });
      await db.delete(t.pushSchedule).where(and(eq(t.pushSchedule.deviceId, deviceId), isNull(t.pushSchedule.sentAt)));
      const rows = items
        .map((i) => ({ id: uuid(), deviceId, at: Date.parse(i.at), kind: i.kind, key: i.key, sentAt: null }))
        .filter((r) => Number.isFinite(r.at) && r.at > now - 60_000);
      if (rows.length) await db.insert(t.pushSchedule).values(rows);
      return rows.length;
    },

    async removePush(deviceId: string) {
      await db.delete(t.pushSchedule).where(eq(t.pushSchedule.deviceId, deviceId));
      await db.delete(t.pushSubscriptions).where(eq(t.pushSubscriptions.deviceId, deviceId));
    },

    /** Unsent items due up to `until`. Older than `staleBefore` are marked sent without sending. */
    async dueItems(until: number, staleBefore: number): Promise<DueItem[]> {
      await db
        .update(t.pushSchedule)
        .set({ sentAt: -1 })
        .where(and(isNull(t.pushSchedule.sentAt), lte(t.pushSchedule.at, staleBefore)));
      return db
        .select({
          id: t.pushSchedule.id,
          deviceId: t.pushSchedule.deviceId,
          at: t.pushSchedule.at,
          kind: t.pushSchedule.kind,
          key: t.pushSchedule.key,
          endpoint: t.pushSubscriptions.endpoint,
          p256dh: t.pushSubscriptions.p256dh,
          auth: t.pushSubscriptions.auth,
          neutral: t.pushSubscriptions.neutral,
        })
        .from(t.pushSchedule)
        .innerJoin(t.pushSubscriptions, eq(t.pushSchedule.deviceId, t.pushSubscriptions.deviceId))
        .where(and(isNull(t.pushSchedule.sentAt), lte(t.pushSchedule.at, until)))
        .orderBy(asc(t.pushSchedule.at))
        .limit(1000);
    },

    async markSent(ids: string[], now = Date.now()) {
      if (ids.length) await db.update(t.pushSchedule).set({ sentAt: now }).where(inArray(t.pushSchedule.id, ids));
    },

    async subscriptions(deviceId?: string) {
      const q = db.select().from(t.pushSubscriptions);
      return deviceId ? q.where(eq(t.pushSubscriptions.deviceId, deviceId)) : q;
    },

    async scheduleFor(deviceId: string) {
      return db.select().from(t.pushSchedule).where(eq(t.pushSchedule.deviceId, deviceId)).orderBy(asc(t.pushSchedule.at));
    },

    // ------------------------------------------------------------ lines
    async catalog(): Promise<Line[]> {
      const rows: LineRow[] = await db.select().from(t.lines).where(eq(t.lines.status, "live"));
      return rows
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((r) => ({ id: r.id, text: r.text, category: r.category, weight: lineWeight(r.up, r.down) }));
    },

    async allLines(): Promise<LineRow[]> {
      return db.select().from(t.lines).orderBy(desc(t.lines.createdAt), asc(t.lines.id));
    },

    async lineById(id: string): Promise<LineRow | undefined> {
      return (await db.select().from(t.lines).where(eq(t.lines.id, id)))[0];
    },

    async insertLine(row: Omit<LineRow, "up" | "down" | "createdAt" | "id"> & { id?: string }, now = Date.now()) {
      const id = row.id ?? `g-${uuid()}`;
      await db.insert(t.lines).values({ ...row, id, up: 0, down: 0, createdAt: now });
      return id;
    },

    async updateLine(id: string, patch: Partial<Pick<LineRow, "text" | "status" | "category">>) {
      await db.update(t.lines).set(patch).where(eq(t.lines.id, id));
    },

    async deleteLine(id: string) {
      await db.delete(t.lines).where(eq(t.lines.id, id));
      await db.delete(t.votes).where(and(eq(t.votes.kind, "line"), eq(t.votes.targetId, id)));
    },

    async topLines(limit = 15): Promise<LineRow[]> {
      const rows: LineRow[] = await db.select().from(t.lines).where(eq(t.lines.status, "live"));
      return rows
        .filter((r) => r.up > r.down)
        .sort((a, b) => b.up - b.down - (a.up - a.down))
        .slice(0, limit);
    },

    // ------------------------------------------------------------ principles
    async livePrinciples(): Promise<string[]> {
      const rows: PrincipleRow[] = await db
        .select()
        .from(t.principles)
        .where(eq(t.principles.status, "live"))
        .orderBy(asc(t.principles.createdAt), asc(t.principles.id));
      return rows.map((r) => r.text);
    },

    async allPrinciples(): Promise<PrincipleRow[]> {
      return db.select().from(t.principles).orderBy(desc(t.principles.createdAt), asc(t.principles.id));
    },

    async insertPrinciple(row: Omit<PrincipleRow, "createdAt" | "id">, now = Date.now()) {
      const id = `p-${uuid()}`;
      await db.insert(t.principles).values({ ...row, id, createdAt: now });
      return id;
    },

    async updatePrinciple(id: string, patch: Partial<Pick<PrincipleRow, "text" | "status">>) {
      await db.update(t.principles).set(patch).where(eq(t.principles.id, id));
    },

    async deletePrinciple(id: string) {
      await db.delete(t.principles).where(eq(t.principles.id, id));
    },

    // ------------------------------------------------------------ feedback
    async vote(deviceId: string, kind: "line" | "answer", targetId: string, vote: 1 | -1, topic: string | null, now = Date.now()) {
      await this.touchDevice(deviceId, now);
      await db
        .insert(t.votes)
        .values({ deviceId, kind, targetId, vote, topic, createdAt: now })
        .onConflictDoUpdate({ target: [t.votes.deviceId, t.votes.kind, t.votes.targetId], set: { vote, createdAt: now } });
      if (kind === "line") await this.recountLine(targetId);
    },

    /** Recompute up/down from votes; disable after DISABLE_AFTER_DOWNVOTES negative votes. */
    async recountLine(id: string) {
      const [row] = await db
        .select({
          up: sql<number>`coalesce(sum(case when ${t.votes.vote} > 0 then 1 else 0 end), 0)`,
          down: sql<number>`coalesce(sum(case when ${t.votes.vote} < 0 then 1 else 0 end), 0)`,
        })
        .from(t.votes)
        .where(and(eq(t.votes.kind, "line"), eq(t.votes.targetId, id)));
      const up = Number(row?.up ?? 0);
      const down = Number(row?.down ?? 0);
      const line = await this.lineById(id);
      if (!line) return;
      const status = down >= DISABLE_AFTER_DOWNVOTES && line.status === "live" ? "disabled" : line.status;
      await db.update(t.lines).set({ up, down, status }).where(eq(t.lines.id, id));
    },

    async answerStats() {
      const rows: { topic: string | null; vote: number }[] = await db
        .select({ topic: t.votes.topic, vote: t.votes.vote })
        .from(t.votes)
        .where(eq(t.votes.kind, "answer"));
      const up = rows.filter((r) => r.vote > 0).length;
      return { up, down: rows.length - up };
    },

    // ------------------------------------------------------------ reports
    async addReport(answerId: string, text: string, topic: string | null, now = Date.now()) {
      const id = uuid();
      await db.insert(t.reports).values({ id, answerId, text, topic, status: "open", createdAt: now });
      return id;
    },

    async reports(status?: string) {
      const q = db.select().from(t.reports);
      return (status ? q.where(eq(t.reports.status, status)) : q).orderBy(desc(t.reports.createdAt));
    },

    async setReportStatus(id: string, status: "open" | "ok" | "removed") {
      await db.update(t.reports).set({ status }).where(eq(t.reports.id, id));
    },

    // ------------------------------------------------------------ topics & usage
    async addTopic(topic: string, now = Date.now()) {
      await db.insert(t.topics).values({ id: uuid(), topic, day: dayOf(now) });
    },

    async topTopics(days = 7, now = Date.now(), limit = 8): Promise<{ topic: string; count: number }[]> {
      const since = dayOf(now - days * 86_400_000);
      const rows = await db
        .select({ topic: t.topics.topic, count: sql<number>`count(*)` })
        .from(t.topics)
        .where(gte(t.topics.day, since))
        .groupBy(t.topics.topic)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
      return rows.map((r: { topic: string; count: number }) => ({ topic: r.topic, count: Number(r.count) }));
    },

    /** Increments today's chat counter; false when the daily limit is reached. */
    async takeChatQuota(deviceId: string, now = Date.now(), limit = CHAT_DAILY_LIMIT): Promise<boolean> {
      const day = dayOf(now);
      const [row] = await db
        .select()
        .from(t.chatUsage)
        .where(and(eq(t.chatUsage.deviceId, deviceId), eq(t.chatUsage.day, day)));
      if (row && row.count >= limit) return false;
      await db
        .insert(t.chatUsage)
        .values({ deviceId, day, count: 1 })
        .onConflictDoUpdate({ target: [t.chatUsage.deviceId, t.chatUsage.day], set: { count: sql`${t.chatUsage.count} + 1` } });
      return true;
    },

    // ------------------------------------------------------------ jobs
    async addJobRun(summary: unknown, now = Date.now()) {
      await db.insert(t.jobRuns).values({ id: uuid(), startedAt: now, summary: JSON.stringify(summary) });
    },

    async jobRuns(limit = 10) {
      const rows = await db.select().from(t.jobRuns).orderBy(desc(t.jobRuns.startedAt)).limit(limit);
      return rows.map((r: { id: string; startedAt: number; summary: string }) => ({ ...r, summary: JSON.parse(r.summary) }));
    },

    // ------------------------------------------------------------ privacy
    /** "Alle Daten löschen": everything linked to the device id. */
    async deleteDevice(deviceId: string) {
      const lineVotes: { targetId: string }[] = await db
        .select({ targetId: t.votes.targetId })
        .from(t.votes)
        .where(and(eq(t.votes.deviceId, deviceId), eq(t.votes.kind, "line")));
      await db.delete(t.votes).where(eq(t.votes.deviceId, deviceId));
      for (const { targetId } of lineVotes) await this.recountLine(targetId);
      await db.delete(t.pushSchedule).where(eq(t.pushSchedule.deviceId, deviceId));
      await db.delete(t.pushSubscriptions).where(eq(t.pushSubscriptions.deviceId, deviceId));
      await db.delete(t.chatUsage).where(eq(t.chatUsage.deviceId, deviceId));
      await db.delete(t.devices).where(eq(t.devices.id, deviceId));
    },

    async deviceFootprint(deviceId: string) {
      const count = async (table: Tables[keyof Tables], col: unknown) =>
        Number((await db.select({ n: sql<number>`count(*)` }).from(table).where(eq(col as never, deviceId)))[0].n);
      return {
        devices: await count(t.devices, t.devices.id),
        subscriptions: await count(t.pushSubscriptions, t.pushSubscriptions.deviceId),
        schedule: await count(t.pushSchedule, t.pushSchedule.deviceId),
        votes: await count(t.votes, t.votes.deviceId),
        chatUsage: await count(t.chatUsage, t.chatUsage.deviceId),
      };
    },
  };
}

type Tables = Database["t"];
export type Store = ReturnType<typeof createStore>;
