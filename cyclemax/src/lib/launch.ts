// Before launch the app itself is closed on the web: cyclemax.app shows "coming soon", and the public pages
// (/questions, /upload, /datenschutz, /impressum) never lead into the app. The iPhone app is not affected.
// The owner opens the app in his browser once with ?vorschau=<code> (remembered on that browser, ?vorschau=aus locks again).
// This is a lock against stumbling in, not a password: the app holds no one else's data.
import { Capacitor } from "@capacitor/core";

export const PREVIEW_PARAM = "vorschau";
export const PREVIEW_CODE = "fels";
export const PREVIEW_KEY = "cyclemax-preview";

export function appLocked(): boolean {
  if (typeof window === "undefined" || Capacitor.isNativePlatform()) return false;
  const param = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
  try {
    if (param === PREVIEW_CODE) localStorage.setItem(PREVIEW_KEY, "1");
    if (param === "aus") localStorage.removeItem(PREVIEW_KEY);
    return localStorage.getItem(PREVIEW_KEY) !== "1";
  } catch {
    return param !== PREVIEW_CODE;
  }
}
