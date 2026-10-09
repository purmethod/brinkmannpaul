"use client";

import { useRouter } from "next/navigation";
import { PHASES } from "@shared/texts";
import { Logo, Wordmark } from "@/components/Logo";
import { Splash } from "@/components/Splash";
import { useApp } from "@/lib/app-context";
import { useCycle, useToday } from "@/lib/hooks";

/** Start: only the ring and CYCLEMAX. One tap opens the app. */
export default function StartPage() {
  const { state } = useApp();
  const router = useRouter();
  const today = useToday();
  const cycle = useCycle(state, today);
  if (!state) return <Splash />;
  const color = state.onboarded && cycle ? PHASES[cycle.phase].color : "#0B0B0C";
  const open = () => router.push(state.onboarded ? "/heute/" : "/onboarding/");
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-bg">
      <button
        type="button"
        onClick={open}
        className="ring-in flex flex-col items-center gap-5 rounded-3xl p-6"
        aria-label="Cyclemax öffnen"
        data-testid="start-ring"
      >
        <Logo size={168} color={color} title="" />
        <Wordmark />
      </button>
    </main>
  );
}
