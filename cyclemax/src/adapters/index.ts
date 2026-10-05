// Picks the adapter set for the current platform. App code only sees the interfaces.
import { Capacitor } from "@capacitor/core";
import { api } from "@/lib/api";
import { createWebPushNotifications, createLocalNotifications, type NotificationAdapter } from "./notifications";
import { createNativePlatform, createWebPlatform, type PlatformAdapter } from "./platform";
import { createIndexedDbStorage, createMemoryStorage, createPreferencesStorage, type StorageAdapter } from "./storage";

export interface Adapters {
  storage: StorageAdapter;
  notifications: NotificationAdapter;
  platform: PlatformAdapter;
}

let cached: Promise<Adapters> | null = null;

async function swRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 5000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function create(): Promise<Adapters> {
  if (Capacitor.isNativePlatform()) {
    const [{ Preferences }, { LocalNotifications }, { Haptics }] = await Promise.all([
      import("@capacitor/preferences"),
      import("@capacitor/local-notifications"),
      import("@capacitor/haptics"),
    ]);
    const name = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    return {
      storage: createPreferencesStorage(Preferences),
      notifications: createLocalNotifications(LocalNotifications),
      platform: createNativePlatform(name, {
        impact: (o) => Haptics.impact(o as never),
        notification: (o) => Haptics.notification(o as never),
      }),
    };
  }
  return {
    storage: typeof indexedDB !== "undefined" ? createIndexedDbStorage() : createMemoryStorage(),
    notifications: createWebPushNotifications({
      api,
      serviceWorker: swRegistration,
      notification: typeof Notification !== "undefined" ? Notification : null,
    }),
    platform: createWebPlatform(),
  };
}

export function getAdapters(): Promise<Adapters> {
  if (!cached) cached = create();
  return cached;
}
