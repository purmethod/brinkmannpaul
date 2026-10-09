// NotificationAdapter
//   Web    = Web Push (VAPID). The client plans, the server only sends at the given instants.
//   Native = @capacitor/local-notifications. Everything is scheduled on the device; cycle data never
//            leaves it. iOS allows max 64 pending notifications – we plan 30 days and refill on start.
import type { PlannedNotification } from "@/engine/notifications";
import type { Api } from "@/lib/api";
import { pushUrl } from "@shared/texts";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export interface ScheduleContext {
  deviceId: string;
  neutral: boolean;
}

export interface NotificationAdapter {
  readonly kind: "web-push" | "local";
  permission(): Promise<PermissionStatus>;
  /** Ask the OS/browser. Must be called from a user gesture on the web. */
  requestPermission(): Promise<PermissionStatus>;
  /** Replace everything planned before with `items`. */
  schedule(items: PlannedNotification[], ctx: ScheduleContext): Promise<number>;
  cancelAll(ctx: ScheduleContext): Promise<void>;
}

// ---------------------------------------------------------------- web

export interface WebPushDeps {
  api: Pick<Api, "pushKey" | "pushSchedule" | "pushUnschedule">;
  serviceWorker: () => Promise<ServiceWorkerRegistration | null>;
  notification: { permission: NotificationPermission; requestPermission(): Promise<NotificationPermission> } | null;
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const mapWebPermission = (p: NotificationPermission): PermissionStatus =>
  p === "granted" ? "granted" : p === "denied" ? "denied" : "prompt";

export function createWebPushNotifications(deps: WebPushDeps): NotificationAdapter {
  async function subscription(): Promise<PushSubscription | null> {
    const reg = await deps.serviceWorker();
    if (!reg?.pushManager) return null;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const { publicKey } = await deps.api.pushKey();
    return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  }

  return {
    kind: "web-push",
    async permission() {
      if (!deps.notification) return "unsupported";
      return mapWebPermission(deps.notification.permission);
    },
    async requestPermission() {
      if (!deps.notification) return "unsupported";
      return mapWebPermission(await deps.notification.requestPermission());
    },
    async schedule(items, ctx) {
      if (deps.notification?.permission !== "granted") return 0;
      const sub = await subscription();
      if (!sub) return 0;
      const res = await deps.api.pushSchedule({
        deviceId: ctx.deviceId,
        subscription: sub.toJSON(),
        neutral: ctx.neutral,
        // Only instant, type and key leave the device – never cycle dates.
        items: items.map(({ at, kind, key }) => ({ at, kind, key })),
      });
      return res.scheduled;
    },
    async cancelAll(ctx) {
      await deps.api.pushUnschedule(ctx.deviceId).catch(() => undefined);
      const reg = await deps.serviceWorker();
      const sub = await reg?.pushManager?.getSubscription();
      await sub?.unsubscribe().catch(() => undefined);
    },
  };
}

// ---------------------------------------------------------------- native

export const IOS_PENDING_LIMIT = 64;

/** Minimal surface of @capacitor/local-notifications (mockable in tests). */
export interface LocalNotificationsLike {
  checkPermissions(): Promise<{ display: string }>;
  requestPermissions(): Promise<{ display: string }>;
  getPending(): Promise<{ notifications: { id: number }[] }>;
  cancel(o: { notifications: { id: number }[] }): Promise<void>;
  schedule(o: {
    notifications: { id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle?: boolean }; extra?: unknown }[];
  }): Promise<unknown>;
}

const mapNativePermission = (p: string): PermissionStatus =>
  p === "granted" ? "granted" : p === "denied" ? "denied" : "prompt";

/** Stable numeric id per calendar day (one notification per day). */
export const notificationId = (date: string) => Number(date.replaceAll("-", ""));

export function createLocalNotifications(plugin: LocalNotificationsLike): NotificationAdapter {
  async function cancelPending() {
    const { notifications } = await plugin.getPending();
    if (notifications.length) await plugin.cancel({ notifications: notifications.map(({ id }) => ({ id })) });
  }
  return {
    kind: "local",
    async permission() {
      return mapNativePermission((await plugin.checkPermissions()).display);
    },
    async requestPermission() {
      return mapNativePermission((await plugin.requestPermissions()).display);
    },
    async schedule(items) {
      if ((await plugin.checkPermissions()).display !== "granted") return 0;
      await cancelPending();
      const batch = items
        .filter((n) => new Date(n.at).getTime() > Date.now())
        .slice(0, IOS_PENDING_LIMIT)
        .map((n) => ({
          id: notificationId(n.date),
          title: n.title,
          body: n.body,
          schedule: { at: new Date(n.at), allowWhileIdle: true },
          extra: { kind: n.kind, key: n.key, url: n.kind === "phase" ? pushUrl(n.key) : "/heute/" },
        }));
      if (batch.length) await plugin.schedule({ notifications: batch });
      return batch.length;
    },
    async cancelAll() {
      await cancelPending();
    },
  };
}
