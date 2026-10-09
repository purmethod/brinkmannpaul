"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/app-context";
import type { AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";
import { Splash } from "./Splash";

/** Shows the splash until state is loaded; sends new users to onboarding. */
export function Gate({ children, onboarding = false }: { children: (s: AppState, a: Adapters) => ReactNode; onboarding?: boolean }) {
  const { state, adapters } = useApp();
  const router = useRouter();
  const redirect = state && (onboarding ? state.onboarded : !state.onboarded);
  useEffect(() => {
    if (redirect) router.replace(onboarding ? "/heute/" : "/onboarding/");
  }, [redirect, onboarding, router]);
  if (!state || !adapters || redirect) return <Splash />;
  return <>{children(state, adapters)}</>;
}
