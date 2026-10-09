"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getAdapters, type Adapters } from "@/adapters";
import { clearJournal, hydrate, initialState, newest, readJournal, STATE_KEY, writeJournal, type AppState } from "./state";
import { refreshCatalog, retryPendingDeletes, syncNotifications } from "./sync";

interface AppContextValue {
  state: AppState | null;
  adapters: Adapters | null;
  update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void;
  /** Wipes everything locally and starts fresh with a new device id. */
  reset(pendingDeletes: string[]): Promise<void>;
}

const Ctx = createContext<AppContextValue | null>(null);

/** Fields that change the notification plan. */
const PLAN_KEYS: (keyof AppState)[] = ["onboarded", "mode", "entries", "usualLength", "dailyTime", "notifications", "neutral", "catalog"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [adapters, setAdapters] = useState<Adapters | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(async (next: AppState) => {
    const stamped = { ...next, savedAt: Date.now() };
    writeJournal(stamped); // synchronous – survives an immediate reload
    const a = await getAdapters();
    await a.storage.set(STATE_KEY, stamped);
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const s = stateRef.current;
      if (!s) return;
      const a = await getAdapters();
      const { history } = await syncNotifications(s, a);
      const merged = { ...stateRef.current!, lineHistory: history };
      stateRef.current = merged;
      setState(merged);
      await persist(merged);
    }, 400);
  }, [persist]);

  const update = useCallback<AppContextValue["update"]>(
    (patch) => {
      const prev = stateRef.current;
      if (!prev) return;
      const p = typeof patch === "function" ? patch(prev) : patch;
      const next = { ...prev, ...p };
      stateRef.current = next;
      setState(next);
      void persist(next);
      if (PLAN_KEYS.some((k) => k in p)) scheduleSync();
    },
    [persist, scheduleSync],
  );

  const reset = useCallback(
    async (pendingDeletes: string[]) => {
      const a = await getAdapters();
      await a.notifications.cancelAll({ deviceId: stateRef.current?.deviceId ?? "", neutral: false }).catch(() => undefined);
      await a.storage.clear();
      clearJournal();
      const fresh = { ...initialState(), pendingDeletes };
      stateRef.current = fresh;
      setState(fresh);
      await persist(fresh);
    },
    [persist],
  );

  // Load once, then refresh catalog, retry pending deletions and (re)plan notifications.
  useEffect(() => {
    let alive = true;
    (async () => {
      const a = await getAdapters();
      let loaded: AppState;
      try {
        const stored = await a.storage.get<AppState>(STATE_KEY);
        loaded = hydrate(newest(stored, a.platform.isNative ? undefined : readJournal()));
      } catch {
        loaded = initialState();
      }
      if (!alive) return;
      stateRef.current = loaded;
      setAdapters(a);
      setState(loaded);
      await persist(loaded);
      const [catalog, deletes] = await Promise.all([refreshCatalog(loaded), retryPendingDeletes(loaded)]);
      if (!alive) return;
      if (catalog || deletes) update({ ...(catalog ?? {}), ...(deletes ?? {}) });
      scheduleSync();
    })();
    const onVisible = () => document.visibilityState === "visible" && stateRef.current && scheduleSync();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [persist, scheduleSync, update]);

  const value = useMemo(() => ({ state, adapters, update, reset }), [state, adapters, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}
