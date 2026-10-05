import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import { atLocalTime } from "@/engine/dates";
import type { PlannedNotification } from "@/engine/notifications";
import { createLocalNotifications, createWebPushNotifications, IOS_PENDING_LIMIT, notificationId, urlBase64ToUint8Array, type LocalNotificationsLike } from "./notifications";
import { createNativePlatform, createWebPlatform, isIosUserAgent } from "./platform";
import { createIndexedDbStorage, createMemoryStorage, createPreferencesStorage, type PreferencesLike, type StorageAdapter } from "./storage";

function plan(days: number, from = "2030-01-01"): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(2030, 0, 1 + i)).toISOString().slice(0, 10);
    if (d < from) continue;
    out.push({ date: d, at: atLocalTime(d, "07:30").toISOString(), kind: "daily", key: `l${i}`, title: "Cyclemax", body: `Zeile ${i}` });
  }
  return out;
}

async function storageContract(s: StorageAdapter) {
  expect(await s.get("missing")).toBeUndefined();
  await s.set("state", { a: 1, list: ["2026-01-01"], nested: { ok: true } });
  expect(await s.get("state")).toEqual({ a: 1, list: ["2026-01-01"], nested: { ok: true } });
  await s.set("n", 5);
  await s.remove("n");
  expect(await s.get("n")).toBeUndefined();
  await s.clear();
  expect(await s.get("state")).toBeUndefined();
}

describe("StorageAdapter", () => {
  it("web: IndexedDB", async () => {
    const s = createIndexedDbStorage(new IDBFactory());
    expect(s.kind).toBe("indexeddb");
    await storageContract(s);
  });
  it("web: IndexedDB persists across adapter instances", async () => {
    const factory = new IDBFactory();
    await createIndexedDbStorage(factory).set("k", "v");
    expect(await createIndexedDbStorage(factory).get("k")).toBe("v");
  });
  it("native: Preferences (mock)", async () => {
    const map = new Map<string, string>();
    const prefs: PreferencesLike = {
      get: async ({ key }) => ({ value: map.get(key) ?? null }),
      set: async ({ key, value }) => void map.set(key, value),
      remove: async ({ key }) => void map.delete(key),
      clear: async () => map.clear(),
    };
    await storageContract(createPreferencesStorage(prefs));
  });
  it("memory", async () => storageContract(createMemoryStorage()));
});

function mockLocal(permission = "granted") {
  let pending: { id: number; title: string; body: string; schedule: { at: Date } }[] = [];
  const plugin: LocalNotificationsLike & { pending: () => typeof pending } = {
    checkPermissions: vi.fn(async () => ({ display: permission })),
    requestPermissions: vi.fn(async () => ({ display: "granted" })),
    getPending: vi.fn(async () => ({ notifications: pending.map(({ id }) => ({ id })) })),
    cancel: vi.fn(async ({ notifications }: { notifications: { id: number }[] }) => {
      const ids = new Set(notifications.map((n) => n.id));
      pending = pending.filter((p) => !ids.has(p.id));
    }),
    schedule: vi.fn(async ({ notifications }) => {
      if (pending.length + notifications.length > IOS_PENDING_LIMIT) throw new Error("iOS limit exceeded");
      pending.push(...notifications);
    }),
    pending: () => pending,
  };
  return plugin;
}

describe("NotificationAdapter native (local notifications)", () => {
  it("schedules locally with stable per-day ids", async () => {
    const plugin = mockLocal();
    const n = createLocalNotifications(plugin);
    expect(await n.schedule(plan(30), { deviceId: "d", neutral: false })).toBe(30);
    expect(plugin.pending()[0].id).toBe(20300101);
    expect(notificationId("2030-12-31")).toBe(20301231);
    expect(plugin.pending()[0].body).toBe("Zeile 0");
  });
  it("respects the iOS limit of 64 pending notifications", async () => {
    const plugin = mockLocal();
    const n = createLocalNotifications(plugin);
    expect(await n.schedule(plan(100), { deviceId: "d", neutral: false })).toBe(IOS_PENDING_LIMIT);
    expect(plugin.pending()).toHaveLength(64);
  });
  it("refills on every app start without exceeding the limit or duplicating", async () => {
    const plugin = mockLocal();
    const n = createLocalNotifications(plugin);
    await n.schedule(plan(64), { deviceId: "d", neutral: false });
    // next start: fresh 30-day plan replaces the old one
    await n.schedule(plan(40, "2030-01-10"), { deviceId: "d", neutral: false });
    const ids = plugin.pending().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(31);
    expect(Math.min(...ids)).toBe(20300110);
  });
  it("does nothing without permission; cancelAll clears", async () => {
    const denied = mockLocal("denied");
    expect(await createLocalNotifications(denied).schedule(plan(5), { deviceId: "d", neutral: false })).toBe(0);
    const plugin = mockLocal();
    const n = createLocalNotifications(plugin);
    await n.schedule(plan(5), { deviceId: "d", neutral: false });
    await n.cancelAll({ deviceId: "d", neutral: false });
    expect(plugin.pending()).toHaveLength(0);
    expect(await n.requestPermission()).toBe("granted");
  });
});

describe("NotificationAdapter web (web push)", () => {
  const sub = { toJSON: () => ({ endpoint: "https://push.example/1", keys: { p256dh: "x", auth: "y" } }), unsubscribe: vi.fn(async () => true) };
  const reg = {
    pushManager: { getSubscription: vi.fn(async () => null as typeof sub | null), subscribe: vi.fn(async () => sub) },
  } as unknown as ServiceWorkerRegistration;

  it("subscribes with the VAPID key and sends only instant, type and key", async () => {
    const pushSchedule = vi.fn(async () => ({ ok: true as const, scheduled: 3 }));
    const n = createWebPushNotifications({
      api: { pushKey: async () => ({ publicKey: "BOrBUQ" }), pushSchedule, pushUnschedule: async () => ({ ok: true }) },
      serviceWorker: async () => reg,
      notification: { permission: "granted", requestPermission: async () => "granted" },
    });
    expect(await n.schedule(plan(3), { deviceId: "dev", neutral: true })).toBe(3);
    const payload = (pushSchedule.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(payload.deviceId).toBe("dev");
    expect(payload.neutral).toBe(true);
    expect((payload.items as object[])[0]).toEqual({ at: plan(1)[0].at, kind: "daily", key: "l0" });
    expect(JSON.stringify(payload)).not.toContain("Zeile");
    expect(JSON.stringify(payload)).not.toContain('"date"');
    expect(reg.pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) });
  });

  it("maps permissions and skips without permission", async () => {
    const pushSchedule = vi.fn();
    const n = createWebPushNotifications({
      api: { pushKey: vi.fn(), pushSchedule, pushUnschedule: vi.fn() } as never,
      serviceWorker: async () => reg,
      notification: { permission: "default", requestPermission: async () => "denied" },
    });
    expect(await n.permission()).toBe("prompt");
    expect(await n.schedule(plan(3), { deviceId: "d", neutral: false })).toBe(0);
    expect(pushSchedule).not.toHaveBeenCalled();
    expect(await n.requestPermission()).toBe("denied");
    const none = createWebPushNotifications({ api: {} as never, serviceWorker: async () => null, notification: null });
    expect(await none.permission()).toBe("unsupported");
  });

  it("decodes base64url VAPID keys", () => {
    expect([...urlBase64ToUint8Array("AQID_w")]).toEqual([1, 2, 3, 255]);
  });
});

describe("PlatformAdapter", () => {
  it("detects iOS user agents (incl. iPadOS)", () => {
    expect(isIosUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(isIosUserAgent("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
  });
  it("web: standalone detection", () => {
    const win = { navigator: { userAgent: "iPhone", maxTouchPoints: 5, standalone: true }, matchMedia: () => ({ matches: false }) } as unknown as Window;
    const p = createWebPlatform(win);
    expect(p.isNative).toBe(false);
    expect(p.isIosWeb()).toBe(true);
    expect(p.isInstalled()).toBe(true);
  });
  it("native: haptics on, install hint off", async () => {
    const haptics = { impact: vi.fn(async () => undefined), notification: vi.fn(async () => undefined) };
    const p = createNativePlatform("ios", haptics);
    expect(p.isIosWeb()).toBe(false);
    expect(p.isInstalled()).toBe(true);
    await p.haptic("success");
    await p.haptic("impact");
    expect(haptics.notification).toHaveBeenCalledWith({ type: "SUCCESS" });
    expect(haptics.impact).toHaveBeenCalledWith({ style: "LIGHT" });
  });
});
