"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PURE_URL } from "@shared/texts";
import type { Mode } from "@shared/types";
import { Gate } from "@/components/Gate";
import { InstallHint } from "@/components/InstallHint";
import { Logo, Wordmark } from "@/components/Logo";
import { Button, Screen } from "@/components/ui";
import { Wheel } from "@/components/Wheel";
import type { DateStr } from "@/engine/dates";
import { useApp } from "@/lib/app-context";
import { pastDays } from "@/lib/format";
import { useToday } from "@/lib/hooks";
import type { AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";

export default function OnboardingPage() {
  return <Gate onboarding>{(state, adapters) => <Onboarding state={state} adapters={adapters} />}</Gate>;
}

type Step = "welcome" | "mode" | "cycle" | "notify";

function Onboarding({ state, adapters }: { state: AppState; adapters: Adapters }) {
  const { update } = useApp();
  const router = useRouter();
  const today = useToday();
  const [step, setStep] = useState<Step>("welcome");
  const [mode, setMode] = useState<Mode>(state.mode);
  const [date, setDate] = useState<DateStr>(today);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const needsInstall = adapters.platform.isIosWeb() && !adapters.platform.isInstalled();

  const finish = (notifications: boolean) => {
    update({
      onboarded: true,
      mode,
      entries: mode === "relationship" ? [date] : [],
      notifications,
    });
    router.replace("/heute/");
  };

  const enable = async () => {
    setBusy(true);
    try {
      const p = await adapters.notifications.requestPermission();
      if (p === "granted") return finish(true);
      setDenied(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <div className="flex h-12 items-center justify-center gap-2" aria-hidden="true">
        {(["welcome", "mode", "notify"] as const).map((s, i) => {
          const current = step === s || (s === "mode" && step === "cycle");
          return <span key={s} className={`h-1.5 rounded-full transition-all ${current ? "w-6 bg-ink" : "w-1.5 bg-line"}`} data-step={i} />;
        })}
      </div>

      {step === "welcome" && (
        <section className="fade-up flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Logo size={120} />
              <Wordmark />
            </div>
            <h1 className="max-w-[16rem] text-[34px] leading-[1.1] font-semibold tracking-tight">Sei der Fels in der Brandung.</h1>
            <a href={PURE_URL} target="_blank" rel="noreferrer" className="text-[15px] text-muted underline underline-offset-4">
              Fundament: PURE Method
            </a>
          </div>
          <Button onClick={() => setStep("mode")}>Weiter</Button>
        </section>
      )}

      {step === "mode" && (
        <section className="fade-up flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center gap-4">
            <h1 className="mb-6 text-[32px] leading-tight font-semibold tracking-tight">Beziehung oder Single?</h1>
            {(
              [
                ["relationship", "Beziehung"],
                ["single", "Single"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setStep(value === "relationship" ? "cycle" : "notify");
                }}
                className={`flex min-h-20 items-center rounded-2xl px-6 text-left text-[22px] font-medium transition-colors ${
                  mode === value ? "bg-ink text-white" : "bg-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "cycle" && (
        <section className="fade-up flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center gap-6">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Wann hat ihre letzte Blutung begonnen?</h1>
            <Wheel items={pastDays(today, 60)} value={date} onChange={setDate} label="Erster Tag der Blutung" testId="date-wheel" />
            <p className="text-center text-[14px] text-muted">Den Rest lernt Cyclemax mit jedem Eintrag.</p>
          </div>
          <Button onClick={() => setStep("notify")}>Weiter</Button>
        </section>
      )}

      {step === "notify" && (
        <section className="fade-up flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center gap-6">
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
              {mode === "single" ? "Jeden Tag eine Zeile." : "Ich sag dir rechtzeitig Bescheid."}
            </h1>
            <p className="text-[17px] leading-relaxed text-muted">
              {mode === "single"
                ? "Maximal eine Nachricht am Tag. Kurz. Zur richtigen Zeit."
                : "Maximal eine Nachricht am Tag: eine Zeile für dich – und eine Vorwarnung, bevor es stürmisch wird."}
            </p>
            {needsInstall && <InstallHint />}
            {denied && <p className="text-[15px] text-accent">Benachrichtigungen sind blockiert. Du kannst sie später in den Einstellungen deines Geräts erlauben.</p>}
          </div>
          <div className="flex flex-col gap-3">
            {!needsInstall && (
              <Button onClick={enable} disabled={busy} data-testid="enable-notifications">
                Benachrichtigungen aktivieren
              </Button>
            )}
            <Button variant={needsInstall ? "primary" : "ghost"} onClick={() => finish(false)} data-testid="skip-notifications">
              {needsInstall ? "Erst mal ohne" : "Später"}
            </Button>
          </div>
        </section>
      )}
    </Screen>
  );
}
