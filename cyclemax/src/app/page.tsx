"use client";

import { Wordmark } from "@/components/Logo";
import { Splash } from "@/components/Splash";
import { useApp } from "@/lib/app-context";

/** Coming soon: preserve the mark without an interactive app entry. */
export default function StartPage() {
  const { state } = useApp();
  if (!state) return <Splash />;
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-bg">
      <div
        className="ring-in relative flex flex-col items-center gap-5 rounded-3xl p-6"
        data-testid="start-ring"
      >
        <div className="coming-soon-ring" aria-hidden="true" />
        <Wordmark />
        <p className="absolute inset-x-0 top-full text-center text-xs tracking-[0.2em] text-muted">
          coming soon
        </p>
      </div>
    </main>
  );
}
