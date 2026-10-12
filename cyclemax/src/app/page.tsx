"use client";

import { PHASES } from "@shared/texts";
import { Logo, Wordmark } from "@/components/Logo";
import { Splash } from "@/components/Splash";
import { useApp } from "@/lib/app-context";
import { useCycle, useToday } from "@/lib/hooks";

/** Coming soon: preserve the mark without an interactive app entry. */
export default function StartPage() {
  const { state } = useApp();
  const today = useToday();
  const cycle = useCycle(state, today);
  if (!state) return <Splash />;
  const color = state.onboarded && cycle ? PHASES[cycle.phase].color : "#0B0B0C";
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-bg">
      <div
        className="ring-in relative flex flex-col items-center gap-5 rounded-3xl p-6"
        data-testid="start-ring"
      >
        <Logo size={168} color={color} title="" />
        <Wordmark />
        <p className="absolute inset-x-0 top-full text-center text-xs tracking-[0.2em] text-muted">
          coming soon
        </p>
      </div>
    </main>
  );
}
