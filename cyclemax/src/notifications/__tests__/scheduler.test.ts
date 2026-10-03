import { atLocalTime, planNotifications, DEFAULT_GESTURE_INTERVALS, GESTURE_ORDER, type GestureLogs } from '@/engine';

import { buildRequests, notificationText, type ScheduledRequest } from '../content';
import { createScheduler, type NotificationApi } from '../scheduler';

function fakeApi(granted = true) {
  const scheduled = new Map<string, ScheduledRequest>();
  const calls: string[] = [];
  const api: NotificationApi = {
    isGranted: async () => granted,
    cancelAll: async () => {
      calls.push('cancel');
      await new Promise((r) => setTimeout(r, 1));
      scheduled.clear();
    },
    schedule: async (r) => {
      calls.push(`schedule ${r.identifier}`);
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (scheduled.has(r.identifier)) throw new Error(`duplicate ${r.identifier}`);
      scheduled.set(r.identifier, r);
    },
  };
  return { api, scheduled, calls };
}

const logs = Object.fromEntries(
  GESTURE_ORDER.map((id) => [id, { last: null, previous: null }]),
) as unknown as GestureLogs;
const planFor = (lastPeriodStart: string) =>
  planNotifications(
    {
      cycle: { lastPeriodStart, cycleLength: 28, periodLength: 5 },
      time: { hour: 8, minute: 0 },
      logs,
      intervals: DEFAULT_GESTURE_INTERVALS,
      installedAt: '2026-01-01',
      lastGestureReminder: null,
      pendingGestureReminder: null,
    },
    atLocalTime('2026-03-02', 12, 0),
  ).notifications;

describe('scheduler', () => {
  it('replaces all scheduled notifications and never duplicates on re-planning', async () => {
    const { api, scheduled } = fakeApi();
    const scheduler = createScheduler(api);
    const first = buildRequests(planFor('2026-03-01'), 'de', false);
    const second = buildRequests(planFor('2026-02-27'), 'de', false);
    // Fired without awaiting, like rapid state changes in the UI.
    void scheduler.sync(first);
    void scheduler.sync(second);
    await scheduler.sync(first);
    expect([...scheduled.keys()].sort()).toEqual(first.map((r) => r.identifier).sort());
  });

  it('skips work when nothing changed, but reschedules after invalidate()', async () => {
    const { api, calls } = fakeApi();
    const scheduler = createScheduler(api);
    const requests = buildRequests(planFor('2026-03-01'), 'de', false);
    await scheduler.sync(requests);
    const afterFirst = calls.length;
    await scheduler.sync(requests);
    expect(calls).toHaveLength(afterFirst);
    scheduler.invalidate();
    await scheduler.sync(requests);
    expect(calls.length).toBeGreaterThan(afterFirst);
  });

  it('removes duplicate identifiers inside one list', async () => {
    const { api, scheduled } = fakeApi();
    const requests = buildRequests(planFor('2026-03-01'), 'de', false);
    await createScheduler(api).sync([...requests, ...requests]);
    expect(scheduled.size).toBe(requests.length);
  });

  it('schedules nothing without permission and retries later', async () => {
    const denied = fakeApi(false);
    const scheduler = createScheduler(denied.api);
    const requests = buildRequests(planFor('2026-03-01'), 'de', false);
    await scheduler.sync(requests);
    expect(denied.scheduled.size).toBe(0);
    await scheduler.sync(requests);
    expect(denied.calls.filter((c) => c === 'cancel')).toHaveLength(2);
  });

  it('survives a failing native call', async () => {
    const { api } = fakeApi();
    let fail = true;
    const flaky: NotificationApi = {
      ...api,
      cancelAll: async () => {
        if (fail) {
          fail = false;
          throw new Error('native error');
        }
        return api.cancelAll();
      },
    };
    const scheduler = createScheduler(flaky);
    const requests = buildRequests(planFor('2026-03-01'), 'de', false);
    await expect(scheduler.sync(requests)).resolves.toBeUndefined();
    await expect(scheduler.sync(requests)).resolves.toBeUndefined();
  });
});

describe('notification text', () => {
  const phase = {
    id: 'phase:2026-03-24:brandung',
    kind: 'phase',
    phase: 'brandung',
    date: '2026-03-24',
    hour: 8,
    minute: 0,
  } as const;
  const gesture = {
    id: 'gesture:2026-03-07:flowers',
    kind: 'gesture',
    gesture: 'flowers',
    date: '2026-03-07',
    hour: 8,
    minute: 0,
  } as const;

  it('uses the phase name and the push text', () => {
    expect(notificationText(phase, 'de', false)).toEqual({
      title: 'Brandung',
      body: 'Brandung kommt. Sei der Fels. Du musst nicht das letzte Wort haben.',
    });
    expect(notificationText(gesture, 'en', false)).toEqual({
      title: 'Flowers',
      body: 'Not because the calendar says so. Because you are a man who pays attention.',
    });
  });

  it('shows only "Cyclemax" in neutral mode', () => {
    expect(notificationText(phase, 'de', true)).toEqual({ title: 'Cyclemax', body: null });
    expect(notificationText(gesture, 'de', true)).toEqual({ title: 'Cyclemax', body: null });
  });

  it('fires at the planned local time', () => {
    const [request] = buildRequests([phase], 'de', false);
    expect(request!.date.getHours()).toBe(8);
    expect(request!.date.getDate()).toBe(24);
  });
});
