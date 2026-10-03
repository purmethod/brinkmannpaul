import { addDays, diffDays, type ISODate } from './dates';
import {
  BRANDUNG_DAYS,
  CYCLE_LENGTH,
  LUTEAL_DAYS,
  PERIOD_LENGTH,
  type CycleInput,
  type CycleStatus,
  type PhaseId,
  type PhaseSegment,
} from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

export function clampCycleLength(value: number): number {
  return Number.isFinite(value) ? clamp(value, CYCLE_LENGTH.min, CYCLE_LENGTH.max) : CYCLE_LENGTH.default;
}

export function clampPeriodLength(value: number): number {
  return Number.isFinite(value) ? clamp(value, PERIOD_LENGTH.min, PERIOD_LENGTH.max) : PERIOD_LENGTH.default;
}

/** Estimated ovulation (1-based cycle day). */
export function ovulationDay(cycleLength: number): number {
  return clampCycleLength(cycleLength) - LUTEAL_DAYS;
}

/**
 * Splits a cycle into the four phases, gap-free and without overlap:
 *  1. Ruhe       day 1 … period end
 *  2. Aufwind    after the period … 3 days before ovulation
 *  3. Hochphase  2 days before ovulation … 6 days before the next period
 *  4. Brandung   the last 5 days before the next period
 * In very short cycles with a long period the ovulation window would collide with the period;
 * then the period wins and Aufwind keeps at least one day, so every phase (and its push) exists.
 */
export function getPhaseSegments(cycleLength: number, periodLength: number): PhaseSegment[] {
  const L = clampCycleLength(cycleLength);
  const P = clampPeriodLength(periodLength);
  const brandungStart = L - BRANDUNG_DAYS + 1;
  const hochStart = Math.max(ovulationDay(L) - 2, P + 2);
  const seg = (phase: PhaseId, startDay: number, endDay: number): PhaseSegment => ({
    phase,
    startDay,
    endDay,
    length: endDay - startDay + 1,
  });
  return [
    seg('ruhe', 1, P),
    seg('aufwind', P + 1, hochStart - 1),
    seg('hochphase', hochStart, brandungStart - 1),
    seg('brandung', brandungStart, L),
  ];
}

export function phaseForCycleDay(cycleDay: number, segments: PhaseSegment[]): PhaseSegment {
  const last = segments[segments.length - 1];
  if (!last) throw new Error('No segments');
  if (cycleDay > last.endDay) return last;
  return segments.find((s) => cycleDay >= s.startDay && cycleDay <= s.endDay) ?? last;
}

/**
 * Status of any calendar date relative to the last logged period.
 * Dates before the logged start are projected backwards with the cycle length.
 * Dates from the expected next period onwards count as "late": the phase stays Brandung
 * until a new period is logged.
 */
export function getCycleStatus(input: CycleInput, date: ISODate): CycleStatus {
  const L = clampCycleLength(input.cycleLength);
  const P = clampPeriodLength(input.periodLength);
  const segments = getPhaseSegments(L, P);
  const mode = input.hormonalContraception ? 'periodOnly' : 'natural';
  const sinceStart = diffDays(date, input.lastPeriodStart);

  if (sinceStart >= L) {
    const brandung = segments[3]!;
    const cycleDay = sinceStart + 1;
    return {
      mode,
      phase: 'brandung',
      isPeriodDay: false,
      cycleDay,
      cycleLength: L,
      dayInPhase: cycleDay - brandung.startDay + 1,
      phaseLength: brandung.length,
      cycleStart: input.lastPeriodStart,
      nextPeriodStart: addDays(input.lastPeriodStart, L),
      isLate: true,
      daysLate: cycleDay - L,
      cycleIndex: 0,
      segments,
    };
  }

  const cycleIndex = Math.floor(sinceStart / L);
  const cycleStart = addDays(input.lastPeriodStart, cycleIndex * L);
  const cycleDay = sinceStart - cycleIndex * L + 1;
  const segment = phaseForCycleDay(cycleDay, segments);
  return {
    mode,
    phase: segment.phase,
    isPeriodDay: segment.phase === 'ruhe',
    cycleDay,
    cycleLength: L,
    dayInPhase: cycleDay - segment.startDay + 1,
    phaseLength: segment.length,
    cycleStart,
    nextPeriodStart: addDays(cycleStart, L),
    isLate: false,
    daysLate: 0,
    cycleIndex,
    segments,
  };
}

/** Calendar date on which a phase starts in the cycle beginning at cycleStart. */
export function phaseStartDate(cycleStart: ISODate, segment: PhaseSegment): ISODate {
  return addDays(cycleStart, segment.startDay - 1);
}
