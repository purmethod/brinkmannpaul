// Web push delivery (VAPID). The client planned the instants; the server only sends.
import webpush from "web-push";
import { NEUTRAL_BODY, NEUTRAL_TITLE, APP_NAME, PHASE_PUSH_TEXT, isPhasePushKey } from "../shared/texts";
import type { Config } from "./env";
import type { DueItem, Store } from "./store";

export interface PushSender {
  send(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<{ statusCode: number }>;
}

let devKeys: { publicKey: string; privateKey: string } | null = null;

/** VAPID keys from env; in local dev without keys, ephemeral keys (logged once). */
export function vapidKeys(config: Config): { publicKey: string; privateKey: string } {
  if (config.vapidPublicKey && config.vapidPrivateKey) {
    return { publicKey: config.vapidPublicKey, privateKey: config.vapidPrivateKey };
  }
  if (!devKeys) {
    devKeys = webpush.generateVAPIDKeys();
    console.warn("VAPID keys missing – using ephemeral dev keys. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY in production.");
  }
  return devKeys;
}

/** `extra` lets tests pass an https.Agent for a local push service with a self-signed cert. */
export function createWebPushSender(config: Config, extra: webpush.RequestOptions = {}): PushSender {
  const keys = vapidKeys(config);
  return {
    async send(sub, payload) {
      const res = await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { vapidDetails: { subject: config.vapidSubject, ...keys }, TTL: 6 * 3600, urgency: "normal", ...extra },
      );
      return { statusCode: res.statusCode };
    },
  };
}

export function payloadFor(item: Pick<DueItem, "kind" | "key" | "neutral">, lineText: (id: string) => string | undefined) {
  if (item.neutral) return { title: NEUTRAL_TITLE, body: NEUTRAL_BODY, tag: "cyclemax", url: "/" };
  const body = item.kind === "phase" && isPhasePushKey(item.key) ? PHASE_PUSH_TEXT[item.key] : lineText(item.key);
  if (!body) return null;
  return { title: APP_NAME, body, tag: "cyclemax", url: "/" };
}

/** Hourly cron: send everything due (±lead minutes), drop stale items, clean dead subscriptions. */
export async function sendDuePushes(store: Store, sender: PushSender, config: Config, now = Date.now()) {
  const due = await store.dueItems(now + config.pushLeadMinutes * 60_000, now - config.pushStaleMinutes * 60_000);
  const lines = new Map((await store.allLines()).map((l) => [l.id, l.text]));
  const sent: string[] = [];
  const dead = new Set<string>();
  let failed = 0;
  let delivered = 0;
  // Max one push per device and run (max one per day is guaranteed by the client plan).
  const seen = new Set<string>();
  for (const item of due) {
    if (seen.has(item.deviceId) || dead.has(item.deviceId)) {
      sent.push(item.id);
      continue;
    }
    seen.add(item.deviceId);
    const payload = payloadFor(item, (id) => lines.get(id));
    if (!payload) {
      sent.push(item.id);
      continue;
    }
    try {
      await sender.send(item, JSON.stringify(payload));
      sent.push(item.id);
      delivered++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        dead.add(item.deviceId);
        sent.push(item.id);
      } else failed++;
    }
  }
  await store.markSent(sent, now);
  for (const deviceId of dead) await store.removePush(deviceId);
  return { due: due.length, delivered, failed, removedSubscriptions: dead.size };
}
