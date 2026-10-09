// Web push delivery (VAPID). The client planned the instants; the server only sends.
import webpush from "web-push";
import { NEUTRAL_BODY, NEUTRAL_TITLE, APP_NAME, PHASE_PUSH_TEXT, isPhasePushKey, pushUrl } from "../shared/texts";
import type { Config } from "./env";
import type { DueItem, Store } from "./store";

export interface PushSender {
  send(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<{ statusCode: number }>;
}

let devKeys: { publicKey: string; privateKey: string } | null = null;

/**
 * VAPID keys from env. In local dev without keys: ephemeral keys (logged once).
 * In production: null – ephemeral keys differ per serverless instance and would never deliver.
 */
export function vapidKeys(config: Config): { publicKey: string; privateKey: string } | null {
  if (config.vapidPublicKey && config.vapidPrivateKey) {
    return { publicKey: config.vapidPublicKey, privateKey: config.vapidPrivateKey };
  }
  if (config.production) return null;
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
      if (!keys) throw Object.assign(new Error("VAPID keys missing"), { statusCode: 503 });
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
  if (item.neutral) return { title: NEUTRAL_TITLE, body: NEUTRAL_BODY, tag: "cyclemax", url: pushUrl(item.key) };
  const body = item.kind === "phase" && isPhasePushKey(item.key) ? PHASE_PUSH_TEXT[item.key] : lineText(item.key);
  if (!body) return null;
  return { title: APP_NAME, body, tag: "cyclemax", url: pushUrl(item.key) };
}

/**
 * Hourly cron: send what is due (±lead minutes), drop stale items, clean dead subscriptions.
 * Per device only the newest due item is sent (max one per day is guaranteed by the client plan);
 * older due items of that device are marked done only after a successful send.
 */
export async function sendDuePushes(store: Store, sender: PushSender, config: Config, now = Date.now()) {
  if (!vapidKeys(config)) return { due: 0, delivered: 0, failed: 0, removedSubscriptions: 0, skipped: "VAPID keys missing" };
  const due = await store.dueItems(now + config.pushLeadMinutes * 60_000, now - config.pushStaleMinutes * 60_000);
  const lines = new Map((await store.allLines()).map((l) => [l.id, l.text]));
  const byDevice = new Map<string, DueItem[]>();
  for (const item of due) byDevice.set(item.deviceId, [...(byDevice.get(item.deviceId) ?? []), item]);

  const done: string[] = [];
  const dead: string[] = [];
  let delivered = 0;
  let failed = 0;
  for (const [deviceId, items] of byDevice) {
    // newest first; skip items whose text no longer exists
    const candidates = [...items].sort((a, b) => b.at - a.at);
    const pick = candidates.map((item) => ({ item, payload: payloadFor(item, (id) => lines.get(id)) })).find((c) => c.payload);
    if (!pick) {
      done.push(...items.map((i) => i.id));
      continue;
    }
    try {
      await sender.send(pick.item, JSON.stringify(pick.payload));
      delivered++;
      done.push(...items.map((i) => i.id));
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        dead.push(deviceId);
        done.push(...items.map((i) => i.id));
      } else failed++; // transient: everything stays unsent and is retried next run
    }
  }
  await store.markSent(done, now);
  for (const deviceId of dead) await store.removePush(deviceId);
  return { due: due.length, delivered, failed, removedSubscriptions: dead.length };
}
