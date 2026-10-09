// PlatformAdapter: Web / iOS / Android. App logic asks this, never Capacitor directly.

export type PlatformName = "web" | "ios" | "android";
export type HapticKind = "impact" | "success";

export interface PlatformAdapter {
  readonly name: PlatformName;
  readonly isNative: boolean;
  /** iPhone/iPad Safari (web) – needs "Teilen → Zum Home-Bildschirm" before web push works. */
  isIosWeb(): boolean;
  /** Running as installed PWA (home screen) or native app. */
  isInstalled(): boolean;
  haptic(kind: HapticKind): Promise<void>;
}

export interface HapticsLike {
  impact(o: { style: "LIGHT" | "MEDIUM" | "HEAVY" }): Promise<void>;
  notification(o: { type: "SUCCESS" | "WARNING" | "ERROR" }): Promise<void>;
}

export function isIosUserAgent(ua: string, maxTouchPoints = 0): boolean {
  // iPadOS reports itself as Mac; detect via touch points.
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
}

export function createWebPlatform(win: Window = window): PlatformAdapter {
  return {
    name: "web",
    isNative: false,
    isIosWeb: () => isIosUserAgent(win.navigator.userAgent, win.navigator.maxTouchPoints),
    isInstalled: () =>
      win.matchMedia?.("(display-mode: standalone)").matches === true ||
      (win.navigator as Navigator & { standalone?: boolean }).standalone === true,
    async haptic() {
      // Web: no haptics (navigator.vibrate is not available on iOS and too crude elsewhere).
    },
  };
}

export function createNativePlatform(name: "ios" | "android", haptics: HapticsLike): PlatformAdapter {
  return {
    name,
    isNative: true,
    isIosWeb: () => false,
    isInstalled: () => true,
    async haptic(kind) {
      try {
        if (kind === "success") await haptics.notification({ type: "SUCCESS" });
        else await haptics.impact({ style: "LIGHT" });
      } catch {
        // Haptics are a nice-to-have.
      }
    },
  };
}
