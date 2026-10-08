"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AFTER_ENTRY_TEXT, PHASES } from "@shared/texts";
import { Gate } from "@/components/Gate";
import { IconSettings } from "@/components/icons";
import { Ring } from "@/components/Ring";
import { Thumbs } from "@/components/Thumbs";
import { Button, Screen, Sheet } from "@/components/ui";
import { Wheel } from "@/components/Wheel";
import { addBleeding } from "@/engine/cycle";
import type { DateStr } from "@/engine/dates";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { pastDays } from "@/lib/format";
import { useCycle, useToday, useTodayLine } from "@/lib/hooks";
import type { AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";

export default function HomePage() {
  return <Gate>{(state, adapters) => <Home state={state} adapters={adapters} />}</Gate>;
}

function Home({ state, adapters }: { state: AppState; adapters: Adapters }) {
  const { update } = useApp();
  const today = useToday();
  const cycle = useCycle(state, today);
  const line = useTodayLine(state, today);
  const [sheet, setSheet] = useState(false);
  const [pick, setPick] = useState<DateStr>(today);
  const [toast, setToast] = useState<{ prev: DateStr[] } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (toastTimer.current && clearTimeout(toastTimer.current)), []);

  const logBleeding = (date: DateStr) => {
    const prev = state.entries;
    update({ entries: addBleeding(prev, date) });
    void adapters.platform.haptic("success");
    setToast({ prev });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 8000);
  };

  const vote = (v: 1 | -1) => {
    if (!line) return;
    void adapters.platform.haptic("impact");
    update((s) => ({ lineVotes: { ...s.lineVotes, [line.id]: v } }));
    api.feedback(state.deviceId, "line", line.id, v).catch(() => undefined);
  };

  const single = state.mode === "single";

  return (
    <Screen>
      <header className="flex h-12 items-center justify-end">
        <Link href="/settings/" aria-label="Einstellungen" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface">
          <IconSettings />
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {!single && cycle && (
          <div className="fade-up flex flex-col items-center gap-6">
            <Ring phase={cycle.phase} />
            <p className="max-w-[20rem] text-[19px] leading-snug font-medium" data-testid="attitude">
              {PHASES[cycle.phase].attitude}
            </p>
          </div>
        )}
        {!single && !cycle && (
          <p className="max-w-[18rem] text-[19px] leading-snug">Trag den ersten Tag ihrer letzten Blutung ein.</p>
        )}

        {line && (
          <figure className={`fade-up flex flex-col items-center gap-2 ${single ? "" : "border-t border-line pt-6"} w-full`}>
            <blockquote
              className={single ? "max-w-[20rem] text-[28px] leading-tight font-semibold tracking-tight" : "max-w-[20rem] text-[16px] leading-relaxed text-muted"}
              data-testid="daily-line"
            >
              {line.text}
            </blockquote>
            <Thumbs value={state.lineVotes[line.id]} onVote={vote} label="Zeile bewerten" />
          </figure>
        )}
      </section>

      {toast && (
        <div role="status" className="fade-up mb-4 flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4">
          <p className="text-[15px] leading-snug" data-testid="after-entry">{AFTER_ENTRY_TEXT}</p>
          <button
            type="button"
            className="shrink-0 text-[15px] font-medium underline underline-offset-4"
            onClick={() => {
              update({ entries: toast.prev });
              setToast(null);
            }}
          >
            Rückgängig
          </button>
        </div>
      )}

      <nav className="flex flex-col gap-3">
        {!single && (
          <>
            <Button variant="danger" onClick={() => logBleeding(today)} data-testid="bleeding">
              Blutung hat begonnen
            </Button>
            <button
              type="button"
              className="mx-auto -mt-1 h-9 px-3 text-[14px] text-muted underline-offset-4 hover:underline"
              onClick={() => {
                setPick(today);
                setSheet(true);
              }}
            >
              anderes Datum
            </button>
          </>
        )}
        <Link href="/chat/" className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink px-6 text-[17px] font-medium text-white">
          Chat
        </Link>
      </nav>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Erster Tag der Blutung">
        <Wheel items={pastDays(today, 45)} value={pick} onChange={setPick} label="Datum" testId="date-wheel" />
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={() => {
              logBleeding(pick);
              setSheet(false);
            }}
          >
            Eintragen
          </Button>
          <Button variant="ghost" onClick={() => setSheet(false)}>
            Abbrechen
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
}
