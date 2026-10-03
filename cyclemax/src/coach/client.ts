import { PHASES, type Lang } from '@/content';
import type { CycleStatus, PhaseId } from '@/engine';

export type CoachPhase = PhaseId | 'unknown';

/** Exactly what leaves the device: no names, no dates, no ids. */
export interface CoachRequest {
  phase: CoachPhase;
  cycleDay: number;
  daysSinceLastGesture: number | null;
  situation: string;
  lang: Lang;
}

export interface CoachResult {
  text: string;
  source: 'claude' | 'fallback';
}

export const MAX_SITUATION_LENGTH = 280;
const TIMEOUT_MS = 20_000;
const MAX_REPLY_LENGTH = 600;

/** With hormonal contraception only period days are meaningful, so other days are sent as "unknown". */
export function coachPhase(status: CycleStatus): CoachPhase {
  if (status.mode === 'periodOnly') return status.isPeriodDay ? 'ruhe' : 'unknown';
  return status.phase;
}

export function buildCoachRequest(
  status: CycleStatus,
  daysSinceLastGesture: number | null,
  situation: string,
  lang: Lang,
): CoachRequest {
  return {
    phase: coachPhase(status),
    cycleDay: Math.min(120, Math.max(1, status.cycleDay)),
    daysSinceLastGesture,
    situation: situation.trim().slice(0, MAX_SITUATION_LENGTH),
    lang,
  };
}

/** Offline / no key: a fitting impulse from the phase content. `seed` varies it between requests. */
export function coachFallback(request: Pick<CoachRequest, 'phase' | 'lang'>, seed: number): CoachResult {
  const phase: PhaseId = request.phase === 'unknown' ? 'aufwind' : request.phase;
  const impulses = PHASES[request.lang][phase].impulses;
  const index = ((Math.floor(seed) % impulses.length) + impulses.length) % impulses.length;
  return { text: impulses[index]!, source: 'fallback' };
}

export interface AskOptions {
  /** Base URL of the proxy, e.g. https://cyclemax-coach.vercel.app – empty → always fallback. */
  baseUrl: string | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  seed?: number;
}

/** Never throws: any failure (offline, timeout, no key, bad answer) returns the offline impulse. */
export async function askCoach(request: CoachRequest, options: AskOptions): Promise<CoachResult> {
  const fallback = () => coachFallback(request, options.seed ?? Date.now());
  const baseUrl = options.baseUrl?.trim().replace(/\/+$/, '');
  if (!baseUrl) return fallback();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  try {
    const response = await (options.fetchImpl ?? fetch)(`${baseUrl}/api/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return fallback();
    const data: unknown = await response.json();
    const text =
      typeof data === 'object' && data !== null && typeof (data as { text?: unknown }).text === 'string'
        ? (data as { text: string }).text.trim()
        : '';
    if (!text) return fallback();
    return { text: text.slice(0, MAX_REPLY_LENGTH), source: 'claude' };
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}
