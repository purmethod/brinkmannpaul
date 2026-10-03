import type { ISODate } from './dates';

export type PhaseId = 'ruhe' | 'aufwind' | 'hochphase' | 'brandung';

/** Cycle order: Periode → nach der Periode → um den Eisprung → die letzten Tage vor der nächsten Periode. */
export const PHASE_ORDER: readonly PhaseId[] = ['ruhe', 'aufwind', 'hochphase', 'brandung'];

export const CYCLE_LENGTH = { min: 21, max: 40, default: 28 } as const;
export const PERIOD_LENGTH = { min: 3, max: 8, default: 5 } as const;
/** Brandung = the last 5 days before the next period. */
export const BRANDUNG_DAYS = 5;
/** Luteal phase used to estimate ovulation: ovulation day = cycle length − 14. */
export const LUTEAL_DAYS = 14;

export interface CycleInput {
  /** First day of her last logged period. */
  lastPeriodStart: ISODate;
  cycleLength: number;
  periodLength: number;
  /** Hormonal contraception: phases are not natural, only period days are shown. */
  hormonalContraception?: boolean;
}

/** One phase as an inclusive range of 1-based cycle days. */
export interface PhaseSegment {
  phase: PhaseId;
  startDay: number;
  endDay: number;
  length: number;
}

export interface CycleStatus {
  /** 'natural' → all four phases apply; 'periodOnly' → hormonal contraception, only period days are meaningful. */
  mode: 'natural' | 'periodOnly';
  phase: PhaseId;
  isPeriodDay: boolean;
  /** 1-based day in the cycle; exceeds cycleLength while the period is late. */
  cycleDay: number;
  cycleLength: number;
  /** 1-based day within the current phase. */
  dayInPhase: number;
  /** Planned length of the current phase (Brandung keeps growing while late). */
  phaseLength: number;
  cycleStart: ISODate;
  /** Expected first day of the next period. */
  nextPeriodStart: ISODate;
  isLate: boolean;
  daysLate: number;
  /** How many full cycles lie between the logged start and this cycle (negative = before, 0 = logged cycle). */
  cycleIndex: number;
  segments: PhaseSegment[];
}
