"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CLAIM, PURE_URL } from "@shared/texts";
import { Gate } from "@/components/Gate";
import { IconExternal } from "@/components/icons";
import { InstallHint } from "@/components/InstallHint";
import { Button, Screen, Sheet, Toggle, TopBar } from "@/components/ui";
import { Wheel } from "@/components/Wheel";
import { isTimeStr, type DateStr } from "@/engine/dates";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { pastDays } from "@/lib/format";
import { useToday } from "@/lib/hooks";
import type { AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";

export default function SettingsPage() {
  return <Gate>{(state, adapters) => <Settings state={state} adapters={adapters} />}</Gate>;
}

function Row({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-b border-line">
      <label htmlFor={htmlFor} className="text-[17px]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Settings({ state, adapters }: { state: AppState; adapters: Adapters }) {
  const { update, reset } = useApp();
  const router = useRouter();
  const today = useToday();
  const [hint, setHint] = useState<string | null>(null);
  const [dateSheet, setDateSheet] = useState(false);
  const [pick, setPick] = useState<DateStr>(today);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const needsInstall = adapters.platform.isIosWeb() && !adapters.platform.isInstalled();

  const setMode = (mode: AppState["mode"]) => {
    if (mode === "relationship" && state.entries.length === 0) {
      setPick(today);
      setDateSheet(true);
      return;
    }
    update({ mode });
  };

  const toggleNotifications = async (on: boolean) => {
    setHint(null);
    if (!on) return update({ notifications: false });
    if (needsInstall) return setHint("install");
    const p = await adapters.notifications.requestPermission();
    if (p === "granted") update({ notifications: true });
    else setHint("Benachrichtigungen sind blockiert. Erlaube sie in den Einstellungen deines Geräts.");
  };

  const deleteAll = async () => {
    setDeleting(true);
    const id = state.deviceId;
    let pending: string[] = [];
    try {
      await api.deleteDevice(id);
    } catch {
      pending = [id]; // offline: deletion is retried on the next start
    }
    await reset([...state.pendingDeletes, ...pending]);
    router.replace("/onboarding/");
  };

  return (
    <Screen>
      <TopBar title="Einstellungen" />

      <div className="mt-4 flex flex-col">
        <div className="flex min-h-16 items-center border-b border-line">
          <div className="grid w-full grid-cols-2 rounded-xl bg-surface p-1" role="radiogroup" aria-label="Modus">
            {(
              [
                ["relationship", "Beziehung"],
                ["single", "Single"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={state.mode === value}
                onClick={() => setMode(value)}
                className={`h-10 rounded-lg text-[15px] font-medium transition-colors ${state.mode === value ? "bg-white shadow-sm" : "text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Row label="Tägliche Nachricht" htmlFor="daily-time">
          <input
            id="daily-time"
            type="time"
            value={state.dailyTime}
            onChange={(e) => isTimeStr(e.target.value) && update({ dailyTime: e.target.value })}
            className="h-11 rounded-lg bg-surface px-3 text-[17px]"
          />
        </Row>

        <Row label="Benachrichtigungen" htmlFor="notifications">
          <Toggle id="notifications" label="Benachrichtigungen" checked={state.notifications} onChange={toggleNotifications} />
        </Row>
        {hint === "install" ? (
          <div className="py-4">
            <InstallHint />
          </div>
        ) : (
          hint && <p className="py-3 text-[14px] text-accent">{hint}</p>
        )}

        <Row label="Neutrale Benachrichtigungen" htmlFor="neutral">
          <Toggle id="neutral" label="Neutrale Benachrichtigungen" checked={state.neutral} onChange={(v) => update({ neutral: v })} />
        </Row>
        <p className="py-2 text-[13px] text-muted">Sperrbildschirm zeigt dann nur „Cyclemax“.</p>

        <nav className="mt-6 flex flex-col">
          <a href={PURE_URL} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-between border-b border-line text-[17px]">
            PURE Method <IconExternal />
          </a>
          <Link href="/profil/" className="flex min-h-14 items-center border-b border-line text-[17px]">
            {state.mode === "single" ? "Dein Profil" : "Ihr Profil"}
          </Link>
          <Link href="/datenschutz/" className="flex min-h-14 items-center border-b border-line text-[17px]">
            Datenschutz
          </Link>
          <Link href="/impressum/" className="flex min-h-14 items-center border-b border-line text-[17px]">
            Impressum
          </Link>
        </nav>

        <button type="button" onClick={() => setConfirm(true)} className="mt-8 flex min-h-14 items-center text-[17px] font-medium text-accent" data-testid="delete-all">
          Alle Daten löschen
        </button>
      </div>

      <p className="mt-auto pt-10 text-center text-[13px] text-muted">{CLAIM}</p>

      <Sheet open={dateSheet} onClose={() => setDateSheet(false)} title="Erster Tag ihrer letzten Blutung">
        <Wheel items={pastDays(today, 60)} value={pick} onChange={setPick} label="Datum" testId="date-wheel" />
        <div className="mt-6">
          <Button
            onClick={() => {
              update({ mode: "relationship", entries: [pick] });
              setDateSheet(false);
            }}
          >
            Übernehmen
          </Button>
        </div>
      </Sheet>

      <Sheet open={confirm} onClose={() => !deleting && setConfirm(false)} title="Alle Daten löschen?">
        <p className="text-center text-[16px] leading-relaxed text-muted">
          Löscht alles auf diesem Gerät und alles, was zu dieser Geräte-ID auf dem Server liegt. Das lässt sich nicht rückgängig machen.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="danger" onClick={deleteAll} disabled={deleting} data-testid="confirm-delete">
            Endgültig löschen
          </Button>
          <Button variant="ghost" onClick={() => setConfirm(false)} disabled={deleting}>
            Abbrechen
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
}
