"use client";

import { useEffect, useMemo, useState } from "react";
import { cycleStateOn, type CycleState } from "@/engine/cycle";
import { localDate, type DateStr } from "@/engine/dates";
import { lineForDay } from "@/engine/notifications";
import type { Line } from "@shared/types";
import type { AppState } from "./state";
import { effectiveCatalog } from "./sync";

/** Today's local date; updates after midnight and when the app comes back. */
export function useToday(): DateStr {
  const [today, setToday] = useState(() => localDate(new Date()));
  useEffect(() => {
    const tick = () => setToday(localDate(new Date()));
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return today;
}

export function useCycle(state: AppState | null, today: DateStr): CycleState | null {
  return useMemo(
    () => (state && state.mode === "relationship" ? cycleStateOn(state.entries, today, state.usualLength) : null),
    [state, today],
  );
}

/** The day's line – identical to the one in today's notification (shared history). */
export function useTodayLine(state: AppState | null, today: DateStr): Line | null {
  return useMemo(() => {
    if (!state) return null;
    return lineForDay(
      {
        today,
        mode: state.mode,
        entries: state.entries,
        usualLength: state.usualLength,
        lines: effectiveCatalog(state),
        history: state.lineHistory,
        seed: state.deviceId,
      },
      today,
    ).line;
  }, [state, today]);
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
