"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

/** Native app: tapping a local notification opens the screen it points to (Heute). */
export function NativeLinks() {
  const router = useRouter();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    void import("@capacitor/local-notifications").then(async ({ LocalNotifications }) => {
      const h = await LocalNotifications.addListener("localNotificationActionPerformed", (e) => {
        const url = (e.notification.extra as { url?: string } | undefined)?.url;
        if (url?.startsWith("/")) router.push(url);
      });
      remove = () => void h.remove();
    });
    return () => remove?.();
  }, [router]);
  return null;
}
