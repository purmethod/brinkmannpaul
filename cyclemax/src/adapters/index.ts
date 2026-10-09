// Picks the adapter set for the current platform. App code only sees the interfaces.
import { Capacitor } from "@capacitor/core";
import { api } from "@/lib/api";
import { createWebPushNotifications, createLocalNotifications, type NotificationAdapter } from "./notifications";
import { createNativePlatform, createWebPlatform, type PlatformAdapter } from "./platform";
import { createNativeSpeech, createWebSpeech, type SpeechAdapter } from "./speech";
import { createIndexedDbStorage, createMemoryStorage, createPreferencesStorage, type StorageAdapter } from "./storage";

export interface Adapters {
  storage: StorageAdapter;
  notifications: NotificationAdapter;
  platform: PlatformAdapter;
  speech: SpeechAdapter;
}

let cached: Promise<Adapters> | null = null;

async function swRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 5000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function create(): Promise<Adapters> {
  if (Capacitor.isNativePlatform()) {
    const [{ Preferences }, { LocalNotifications }, { Haptics }, { SpeechRecognition }] = await Promise.all([
      import("@capacitor/preferences"),
      import("@capacitor/local-notifications"),
      import("@capacitor/haptics"),
      import("@capacitor-community/speech-recognition"),
    ]);
    const name = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    return {
      storage: createPreferencesStorage(Preferences),
      notifications: createLocalNotifications(LocalNotifications),
      platform: createNativePlatform(name, {
        impact: (o) => Haptics.impact(o as never),
        notification: (o) => Haptics.notification(o as never),
      }),
      speech: createNativeSpeech(SpeechRecognition as never),
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
    speech: createWebSpeech(window),
  };
}

export function getAdapters(): Promise<Adapters> {
  if (!cached) cached = create();
  return cached;
}
