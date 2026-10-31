"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { isUploadPage } from "@/lib/app-context";

/** Registers the offline/push service worker (web production builds only). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || Capacitor.isNativePlatform()) return;
    if (!("serviceWorker" in navigator) || isUploadPage()) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => console.warn("sw", e));
  }, []);
  return null;
}
