"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AFTER_ENTRY_TEXT, afterEntryText, headsUp, PHASES } from "@shared/texts";
import { Gate } from "@/components/Gate";
import { IconSettings } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { IconMic } from "@/components/Mic";
import { Ring } from "@/components/Ring";
import { Thumbs } from "@/components/Thumbs";
import { Button, Screen, Sheet } from "@/components/ui";
import { Wheel } from "@/components/Wheel";
import { addBleeding, cycleStateOn, sortEntries, upcomingPhase } from "@/engine/cycle";
import type { DateStr } from "@/engine/dates";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { dayLabel, pastDays } from "@/lib/format";
import { useCycle, useToday, useTodayLine } from "@/lib/hooks";
import type { AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";

export default function TodayPage() {
  return <Gate>{(state, adapters) => <Today state={state} adapters={adapters} />}</Gate>;
}

function Today({ state, adapters }: { state: AppState; adapters: Adapters }) {
  const { update } = useApp();
  const router = useRouter();
  const today = useToday();
  const cycle = useCycle(state, today);
  const line = useTodayLine(state, today);
  const [sheet, setSheet] = useState(false);
  const [pick, setPick] = useState<DateStr>(today);
  const [toast, setToast] = useState<{ prev: DateStr[]; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (toastTimer.current && clearTimeout(toastTimer.current)), []);

  const single = state.mode === "single";
  const upcoming = upcomingPhase(cycle);
  // The one-tap entry is the main action whenever bleeding is due (or nothing is known yet).
  const due = !single && (!cycle || cycle.phase === "red");
  const hasProfile = !!state.profile.analysis;
  const showNotifHint = state.onboarded && !state.notifications && !state.notifHintDismissed;
  const enableNotifications = async () => {
    if (adapters.platform.isIosWeb() && !adapters.platform.isInstalled()) {
      router.push("/settings/");
      return;
    }
    const p = await adapters.notifications.requestPermission();
    if (p === "granted") update({ notifications: true });
    else update({ notifHintDismissed: true });
  };
  const nextStep = state.profile.analysis?.steps.find((s) => !(state.profile.done ?? []).includes(s));

  const logBleeding = (date: DateStr) => {
    const prev = state.entries;
    const next = addBleeding(prev, date);
    update({ entries: next });
    void adapters.platform.haptic("success");
    const phase = cycleStateOn(next, today, state.usualLength)?.phase;
    const text = date === today || !phase ? AFTER_ENTRY_TEXT : afterEntryText(dayLabel(date, today), PHASES[phase].word);
    setToast({ prev, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 8000);
  };

  const vote = (v: 1 | -1) => {
    if (!line) return;
    void adapters.platform.haptic("impact");
    update((s) => ({ lineVotes: { ...s.lineVotes, [line.id]: v } }));
    api.feedback(state.deviceId, "line", line.id, v).catch(() => undefined);
  };

  const openDateSheet = () => {
    setPick(today);
    setSheet(true);
  };

  const last = sortEntries(state.entries).at(-1);
  const lastLine = last && (
    <p className="text-center text-[13px] text-muted" data-testid="last-entry">
      Zuletzt eingetragen: {dayLabel(last, today)}
    </p>
  );

  // Due: big primary button. Otherwise one slim line – no visual noise.
  const bleeding = due ? (
    <div className="flex flex-col">
      <Button onClick={() => logBleeding(today)} data-testid="bleeding">
        Ihre Tage haben heute begonnen
      </Button>
      <button type="button" className="mx-auto h-10 px-3 text-[14px] text-muted" onClick={openDateSheet}>
        anderes Datum
      </button>
      {lastLine}
    </div>
  ) : (
    <div className="flex items-center justify-between border-t border-line pt-1 text-[15px]">
      <button type="button" className="h-11 pr-3 text-left text-ink" onClick={() => logBleeding(today)} data-testid="bleeding">
        Ihre Tage haben heute begonnen
      </button>
      <button type="button" className="h-11 shrink-0 pl-3 text-muted" onClick={openDateSheet}>
        anderes Datum
      </button>
    </div>
  );
  const bleedingBlock = due ? (
    bleeding
  ) : (
    <div className="flex flex-col gap-1">
      {bleeding}
      {lastLine}
    </div>
  );

  return (
    <Screen>
      <header className="flex h-12 items-center justify-between">
        <Link href="/" aria-label="Start" className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full">
          <Logo size={30} title="" />
        </Link>
        <Link href="/settings/" aria-label="Einstellungen" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface">
          <IconSettings />
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-3 text-center">
        {!single && cycle && (
          <div className="fade-up flex flex-col items-center gap-5">
            <Link href="/verstehen/" aria-label={`${PHASES[cycle.phase].word} – Phase verstehen`} className="rounded-full">
              <Ring phase={cycle.phase} />
            </Link>
            <p className="max-w-[20rem] text-[19px] leading-snug font-medium" data-testid="attitude">
              {PHASES[cycle.phase].attitude}
            </p>
            {!cycle.late && (
              <Link href={`/verstehen/#${cycle.phase}`} className="max-w-[21rem] text-[15px] leading-snug text-muted" data-testid="forecast">
                <span className="text-ink">Was kommen kann:</span> {PHASES[cycle.phase].forecast} <span aria-hidden="true">›</span>
              </Link>
            )}
          </div>
        )}
        {!single && !cycle && <p className="max-w-[18rem] text-[19px] leading-snug">Wenn sie ihre Tage bekommt: ein Tap unten. Mehr musst du nicht tun.</p>}

        {cycle?.late && cycle.cycleDay - cycle.cycleLength >= 3 && (
          <p className="max-w-[21rem] rounded-2xl bg-surface px-5 py-3 text-[15px] leading-snug" data-testid="late-hint">
            Hat sie ihre Tage schon? Ein Tap unten genügt – auch nachträglich über „anderes Datum“. Bis dahin bleibt Standfest.
          </p>
        )}
        {upcoming && (
          <p className="max-w-[21rem] rounded-2xl bg-surface px-5 py-3 text-[15px] leading-snug" data-testid="heads-up">
            {headsUp(upcoming.phase, upcoming.inDays)}
          </p>
        )}

        {nextStep && !toast && (
          <div className="flex w-full max-w-[22rem] items-center justify-between gap-4 rounded-2xl border border-line px-5 py-3 text-left" data-testid="next-step">
            <p className="text-[15px] leading-snug">
              <span className="block text-[11px] tracking-[0.2em] text-muted uppercase">Dein Schritt</span>
              {nextStep}
            </p>
            <button
              type="button"
              aria-label="Erledigt"
              onClick={() => {
                void adapters.platform.haptic("success");
                update((s) => ({ profile: { ...s.profile, done: [...(s.profile.done ?? []), nextStep] } }));
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink text-[18px] active:bg-surface"
            >
              ✓
            </button>
          </div>
        )}
        {line && !toast && (
          <figure className={`fade-up flex w-full flex-col items-center gap-1 ${single ? "" : "border-t border-line pt-6"}`}>
            <blockquote
              className={single ? "max-w-[20rem] text-[28px] leading-tight font-semibold tracking-tight" : "max-w-[20rem] text-[16px] leading-relaxed text-muted"}
              data-testid="daily-line"
            >
              {line.text}
            </blockquote>
            <figcaption className="mt-1 flex items-center gap-1 text-[12px] text-muted">
              Hilft dir das?
              <Thumbs value={state.lineVotes[line.id]} onVote={vote} label="Zeile bewerten" />
            </figcaption>
          </figure>
        )}
      </section>

      {showNotifHint && !toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-2 text-[14px]" data-testid="notif-hint">
          <span className="text-muted">{single ? "Tägliche Zeile ist aus." : "Vorwarnungen sind aus."}</span>
          <span className="flex items-center">
            <button type="button" className="h-10 px-2 font-medium text-ink" onClick={() => void enableNotifications()}>
              Aktivieren
            </button>
            <button type="button" aria-label="Hinweis schließen" className="h-10 w-9 text-muted" onClick={() => update({ notifHintDismissed: true })}>
              ✕
            </button>
          </span>
        </div>
      )}
      {toast && (
        <div role="status" className="fade-up mb-3 flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4">
          <p className="text-[15px] leading-snug" data-testid="after-entry">
            {toast.text}
          </p>
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
        {due && bleedingBlock}
        <div className="flex gap-3">
          <Link
            href="/chat/"
            className={`flex min-h-14 flex-1 items-center justify-center rounded-2xl px-5 text-[17px] font-medium ${due ? "bg-surface text-ink" : "bg-ink text-white"}`}
          >
            Cyclemax fragen
          </Link>
          <Link
            href="/chat/?voice=1"
            aria-label="Cyclemax per Sprache fragen"
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${due ? "bg-surface text-ink" : "bg-ink text-white"}`}
          >
            <IconMic />
          </Link>
        </div>
        <Link href="/profil/" className="flex min-h-12 items-center justify-between rounded-2xl bg-surface px-5 text-[16px]" data-testid="profile-link">
          <span>{hasProfile ? "Dein Profil" : single ? "Erzähl mir von dir" : "Erzähl mir von euch"}</span>
          <span className="text-[13px] text-muted">{hasProfile ? "ansehen" : "2 Minuten, frei sprechen"}</span>
        </Link>
        {!single && !due && bleedingBlock}
      </nav>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Wann haben ihre Tage begonnen?">
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
