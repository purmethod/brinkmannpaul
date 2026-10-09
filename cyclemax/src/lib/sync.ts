// Keeps catalog and planned notifications in sync. Runs on every app start and after changes
// (this is also the "refill" of native local notifications).
import { SEED_LINES } from "@shared/knowledge.generated";
import type { Line } from "@shared/types";
import { localDate } from "@/engine/dates";
import { planNotifications } from "@/engine/notifications";
import type { Adapters } from "@/adapters";
import { api, type Api } from "./api";
import type { AppState } from "./state";

const CATALOG_TTL = 12 * 3600_000;

export function effectiveCatalog(state: AppState): Line[] {
  const base = state.catalog.length ? state.catalog : SEED_LINES;
  // Lines he voted down himself get a lower weight on his device.
  return base.map((l) => (state.lineVotes[l.id] === -1 ? { ...l, weight: (l.weight ?? 1) * 0.3 } : l));
}

export async function refreshCatalog(state: AppState, client: Pick<Api, "lines"> = api, now = Date.now()): Promise<Partial<AppState> | null> {
  if (state.catalog.length && now - state.catalogAt < CATALOG_TTL) return null;
  try {
    const { lines } = await client.lines();
    if (!Array.isArray(lines) || lines.length === 0) return null;
    return { catalog: lines, catalogAt: now };
  } catch {
    return null; // offline: keep cached catalog or the bundled seed lines
  }
}

export async function retryPendingDeletes(state: AppState, client: Pick<Api, "deleteDevice"> = api): Promise<Partial<AppState> | null> {
  if (!state.pendingDeletes.length) return null;
  const left: string[] = [];
  for (const id of state.pendingDeletes) {
    try {
      await client.deleteDevice(id);
    } catch {
      left.push(id);
    }
  }
  return { pendingDeletes: left };
}

/** Plans the next 30 days and hands them to the platform's NotificationAdapter. */
export async function syncNotifications(state: AppState, adapters: Pick<Adapters, "notifications">, now = new Date()) {
  const plan = planNotifications({
    today: localDate(now),
    now,
    mode: state.mode,
    entries: state.entries,
    usualLength: state.usualLength,
    dailyTime: state.dailyTime,
    lines: effectiveCatalog(state),
    history: state.lineHistory,
    seed: state.deviceId,
    neutral: state.neutral,
  });
  const ctx = { deviceId: state.deviceId, neutral: state.neutral };
  let scheduled = 0;
  try {
    if (state.onboarded && state.notifications) scheduled = await adapters.notifications.schedule(plan.notifications, ctx);
    else await adapters.notifications.cancelAll(ctx);
  } catch (e) {
    console.warn("notification sync failed", e);
  }
  return { history: plan.history, scheduled };
}
