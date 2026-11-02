"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/lib/app-context";
import { appLocked } from "@/lib/launch";
import type { AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";
import { Splash } from "./Splash";

/** Shows the splash until state is loaded; sends new users to onboarding. Before launch the web app is closed (see lib/launch). */
export function Gate({ children, onboarding = false }: { children: (s: AppState, a: Adapters) => ReactNode; onboarding?: boolean }) {
  const { state, adapters } = useApp();
  const router = useRouter();
  const [locked, setLocked] = useState<boolean | null>(null);
  useEffect(() => {
    const l = appLocked();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(l);
    if (l) window.location.replace("/");
  }, []);
  const redirect = state && (onboarding ? state.onboarded : !state.onboarded);
  useEffect(() => {
    if (redirect && locked === false) router.replace(onboarding ? "/heute/" : "/onboarding/");
  }, [redirect, onboarding, router, locked]);
  if (locked !== false || !state || !adapters || redirect) return <Splash />;
  return <>{children(state, adapters)}</>;
}
