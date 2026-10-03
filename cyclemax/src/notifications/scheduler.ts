import type { ScheduledRequest } from './content';

/** The subset of expo-notifications the scheduler needs (injected, so it can be tested). */
export interface NotificationApi {
  isGranted(): Promise<boolean>;
  cancelAll(): Promise<void>;
  schedule(request: ScheduledRequest): Promise<void>;
}

export interface Scheduler {
  /** Replaces every scheduled notification with exactly this list. Calls are serialised. */
  sync(requests: ScheduledRequest[]): Promise<void>;
  /** Forces the next sync to reschedule even if the list is unchanged. */
  invalidate(): void;
}

const keyOf = (requests: ScheduledRequest[]) =>
  JSON.stringify(requests.map((r) => [r.identifier, r.title, r.body, r.date.getTime()]));

export function createScheduler(api: NotificationApi): Scheduler {
  let queue: Promise<void> = Promise.resolve();
  let lastKey: string | null = null;

  async function run(requests: ScheduledRequest[]) {
    const unique = Array.from(new Map(requests.map((r) => [r.identifier, r])).values());
    const key = keyOf(unique);
    if (key === lastKey) return;
    lastKey = null;
    await api.cancelAll();
    if (!(await api.isGranted())) return;
    for (const request of unique) await api.schedule(request);
    lastKey = key;
  }

  return {
    sync(requests) {
      // Chained, so two quick changes can never interleave cancel/schedule and leave duplicates.
      queue = queue
        .then(() => run(requests))
        .catch(() => {
          lastKey = null;
        });
      return queue;
    },
    invalidate() {
      lastKey = null;
    },
  };
}
