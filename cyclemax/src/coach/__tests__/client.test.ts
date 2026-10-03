import { getCycleStatus } from '@/engine';
import { PHASES } from '@/content';

import { askCoach, buildCoachRequest, coachFallback, MAX_SITUATION_LENGTH } from '../client';

const status = getCycleStatus({ lastPeriodStart: '2026-03-01', cycleLength: 28, periodLength: 5 }, '2026-03-26');
const request = buildCoachRequest(status, 12, '  Sie ist gereizt wegen der Arbeit ', 'de');

function fakeFetch(impl: () => Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return impl();
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe('coach request', () => {
  it('sends only phase, cycle day, days since the last gesture, the situation and the language', () => {
    expect(request).toEqual({
      phase: 'brandung',
      cycleDay: 26,
      daysSinceLastGesture: 12,
      situation: 'Sie ist gereizt wegen der Arbeit',
      lang: 'de',
    });
    expect(JSON.stringify(request)).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('caps the situation text', () => {
    expect(buildCoachRequest(status, null, 'x'.repeat(1000), 'en').situation).toHaveLength(MAX_SITUATION_LENGTH);
  });

  it('sends "unknown" outside period days with hormonal contraception', () => {
    const input = { lastPeriodStart: '2026-03-01', cycleLength: 28, periodLength: 5, hormonalContraception: true };
    expect(buildCoachRequest(getCycleStatus(input, '2026-03-02'), null, '', 'de').phase).toBe('ruhe');
    expect(buildCoachRequest(getCycleStatus(input, '2026-03-20'), null, '', 'de').phase).toBe('unknown');
  });
});

describe('askCoach', () => {
  it('returns the proxy answer', async () => {
    const { fn, calls } = fakeFetch(async () => jsonResponse(200, { text: ' Atme. Hör zu. ' }));
    const result = await askCoach(request, { baseUrl: 'https://coach.example/', fetchImpl: fn });
    expect(result).toEqual({ text: 'Atme. Hör zu.', source: 'claude' });
    expect(calls[0]!.url).toBe('https://coach.example/api/coach');
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual(request);
  });

  it('falls back to a phase impulse without a configured URL', async () => {
    const result = await askCoach(request, { baseUrl: undefined, seed: 3 });
    expect(result).toEqual({ text: PHASES.de.brandung.impulses[3], source: 'fallback' });
  });

  it.each([
    ['server error', async () => jsonResponse(502, { error: 'upstream' })],
    ['missing key', async () => jsonResponse(503, { error: 'not_configured' })],
    ['malformed answer', async () => jsonResponse(200, { nope: true })],
    ['empty answer', async () => jsonResponse(200, { text: '   ' })],
    ['offline', async () => Promise.reject(new TypeError('Network request failed'))],
    [
      'bad json',
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('x');
          },
        }) as unknown as Response,
    ],
  ])('never throws: %s → offline impulse', async (_label, impl) => {
    const { fn } = fakeFetch(impl as () => Promise<Response>);
    const result = await askCoach(request, { baseUrl: 'https://coach.example', fetchImpl: fn, seed: 1 });
    expect(result).toEqual({ text: PHASES.de.brandung.impulses[1], source: 'fallback' });
  });

  it('gives up after the timeout', async () => {
    const hanging = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })) as unknown as typeof fetch;
    const result = await askCoach(request, {
      baseUrl: 'https://coach.example',
      fetchImpl: hanging,
      timeoutMs: 20,
      seed: 0,
    });
    expect(result.source).toBe('fallback');
  });

  it('uses impulses for every phase and language', () => {
    expect(coachFallback({ phase: 'unknown', lang: 'en' }, 9).text).toBe(PHASES.en.aufwind.impulses[1]);
    expect(coachFallback({ phase: 'ruhe', lang: 'de' }, -1).text).toBe(PHASES.de.ruhe.impulses[7]);
  });
});
