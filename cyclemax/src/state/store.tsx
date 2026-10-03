import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { planNotifications, toISODate, type ISODate } from '@/engine';
import { detectLanguage } from '@/i18n/detect';
import { buildRequests } from '@/notifications/content';
import { configureNotifications, scheduler } from '@/notifications/native';

import { applyNotificationPlan, resetState } from './actions';
import { createInitialState, sanitizeState, type AppState } from './schema';
import { notificationPlanInput } from './selectors';
import { clearState, loadRawState, saveState } from './storage';

type Updater = (state: AppState) => AppState;

interface StoreValue {
  state: AppState;
  /** Local calendar date, refreshed at midnight and whenever the app comes to the foreground. */
  today: ISODate;
  update: (fn: Updater) => void;
  /** Re-plans notifications (e.g. after the permission was granted). */
  resync: () => void;
  reset: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

/** `onChange` must be stable (useCallback). */
function useToday(onChange: () => void): ISODate {
  const [today, setToday] = useState(() => toISODate(new Date()));

  useEffect(() => {
    const refresh = () => {
      setToday(toISODate(new Date()));
      onChange();
    };
    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnight();
    return () => {
      subscription.remove();
      if (timer) clearTimeout(timer);
    };
  }, [onChange]);

  return today;
}

export function StoreProvider({ children }: { children: (ready: boolean) => ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  const resync = useCallback(() => setSyncTick((t) => t + 1), []);
  const today = useToday(resync);
  const stateRef = useRef(state);

  useEffect(() => {
    let alive = true;
    void loadRawState().then((raw) => {
      if (!alive) return;
      setState(sanitizeState(raw, createInitialState(toISODate(new Date()), detectLanguage())));
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (state) void saveState(state);
  }, [state]);

  // Everything the notification plan depends on. Unchanged key → no re-planning.
  const planKey = state
    ? JSON.stringify([notificationPlanInput(state), state.language, state.neutralNotifications])
    : null;

  useEffect(() => {
    const current = stateRef.current;
    if (!current || planKey === null) return;
    const input = notificationPlanInput(current);
    if (!input) {
      void scheduler.sync([]);
      return;
    }
    const plan = planNotifications(input, new Date());
    setState((s) => (s ? applyNotificationPlan(s, plan) : s));
    const requests = buildRequests(plan.notifications, current.language, current.neutralNotifications);
    void configureNotifications()
      .catch(() => {})
      .then(() => scheduler.sync(requests));
  }, [planKey, syncTick]);

  const update = useCallback((fn: Updater) => setState((s) => (s ? fn(s) : s)), []);

  const reset = useCallback(async () => {
    await clearState();
    scheduler.invalidate();
    await scheduler.sync([]);
    setState((s) => resetState(toISODate(new Date()), s?.language ?? detectLanguage()));
  }, []);

  const value = useMemo(
    () => (state ? { state, today, update, resync, reset } : null),
    [state, today, update, resync, reset],
  );

  return <StoreContext.Provider value={value}>{children(value !== null)}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside a loaded StoreProvider');
  return value;
}
