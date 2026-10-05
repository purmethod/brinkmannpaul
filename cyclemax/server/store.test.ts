import { describe, expect, it } from "vitest";
import { SEED_LINES } from "../shared/knowledge.generated";
import { DISABLE_AFTER_DOWNVOTES, lineWeight } from "./store";
import { DEVICE, testContext } from "./test-utils";

const sub = { endpoint: "https://push.example/a", p256dh: "p", auth: "a" };

describe("store", () => {
  it("seeds idempotently", async () => {
    const { store } = await testContext();
    await store.seed();
    const catalog = await store.catalog();
    expect(catalog).toHaveLength(SEED_LINES.length);
    expect(catalog.every((l) => l.weight === 1)).toBe(true);
    expect((await store.livePrinciples()).length).toBeGreaterThan(5);
  });

  it("ratings change weight; 5 negative votes disable a line", async () => {
    const { store } = await testContext();
    const id = SEED_LINES[0].id;
    for (let i = 0; i < DISABLE_AFTER_DOWNVOTES - 1; i++) await store.vote(`device-${i}-xxxx`, "line", id, -1, null);
    expect((await store.lineById(id))!.status).toBe("live");
    expect((await store.catalog()).find((l) => l.id === id)!.weight).toBeCloseTo(lineWeight(0, 4));
    await store.vote("device-last-xxxx", "line", id, -1, null);
    expect((await store.lineById(id))!.status).toBe("disabled");
    expect((await store.catalog()).find((l) => l.id === id)).toBeUndefined();
  });

  it("one vote per device and line (changing the vote replaces it)", async () => {
    const { store } = await testContext();
    const id = SEED_LINES[1].id;
    await store.vote(DEVICE, "line", id, 1, null);
    await store.vote(DEVICE, "line", id, 1, null);
    expect((await store.lineById(id))!.up).toBe(1);
    await store.vote(DEVICE, "line", id, -1, null);
    const l = (await store.lineById(id))!;
    expect([l.up, l.down]).toEqual([0, 1]);
    expect(lineWeight(10, 0)).toBe(3);
    expect(lineWeight(0, 10)).toBe(0.3);
  });

  it("push schedule: replace, due, sent, stale", async () => {
    const { store } = await testContext();
    const now = Date.parse("2026-03-01T06:00:00Z");
    const at = (h: number) => new Date(now + h * 3600_000).toISOString();
    expect(await store.saveSchedule(DEVICE, sub, false, [{ at: at(1), kind: "daily", key: "x" }], now)).toBe(1);
    // replacing drops the old unsent items
    await store.saveSchedule(DEVICE, sub, false, [{ at: at(2), kind: "daily", key: "y" }, { at: at(26), kind: "phase", key: "red7" }], now);
    const due = await store.dueItems(now + 2.5 * 3600_000, now - 3 * 3600_000);
    expect(due.map((d) => d.key)).toEqual(["y"]);
    expect(due[0].endpoint).toBe(sub.endpoint);
    await store.markSent([due[0].id], now);
    expect(await store.dueItems(now + 2.5 * 3600_000, now)).toHaveLength(0);
    // stale items (cron missed) are dropped instead of sent late
    const later = now + 40 * 3600_000;
    expect(await store.dueItems(later, later - 3 * 3600_000)).toHaveLength(0);
  });

  it("deleteDevice removes everything linked to the device id", async () => {
    const { store } = await testContext();
    const id = SEED_LINES[2].id;
    await store.vote(DEVICE, "line", id, 1, null);
    await store.vote(DEVICE, "answer", "ans-1", -1, "Streit");
    await store.saveSchedule(DEVICE, sub, true, [{ at: new Date(Date.now() + 3600_000).toISOString(), kind: "daily", key: id }]);
    await store.takeChatQuota(DEVICE);
    expect(Object.values(await store.deviceFootprint(DEVICE)).every((n) => n > 0)).toBe(true);
    await store.deleteDevice(DEVICE);
    expect(await store.deviceFootprint(DEVICE)).toEqual({ devices: 0, subscriptions: 0, schedule: 0, votes: 0, chatUsage: 0 });
    expect((await store.lineById(id))!.up).toBe(0);
  });

  it("chat quota per device and day", async () => {
    const { store } = await testContext();
    const now = Date.parse("2026-03-01T10:00:00Z");
    for (let i = 0; i < 3; i++) expect(await store.takeChatQuota(DEVICE, now, 3)).toBe(true);
    expect(await store.takeChatQuota(DEVICE, now, 3)).toBe(false);
    expect(await store.takeChatQuota(DEVICE, now + 86_400_000, 3)).toBe(true);
  });

  it("top topics of the last 7 days", async () => {
    const { store } = await testContext();
    const now = Date.parse("2026-03-10T10:00:00Z");
    for (const t of ["Streit", "Streit", "Grenzen", "Streit", "erstes Date"]) await store.addTopic(t, now);
    await store.addTopic("Alt", now - 20 * 86_400_000);
    const top = await store.topTopics(7, now);
    expect(top[0]).toEqual({ topic: "Streit", count: 3 });
    expect(top.map((t) => t.topic)).not.toContain("Alt");
  });
});
