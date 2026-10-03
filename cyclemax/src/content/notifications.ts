import type { PhaseId } from '@/engine';

import type { Lang } from './types';

/** Exactly one push on the first day of each phase. */
export const PHASE_PUSH: Record<Lang, Record<PhaseId, string>> = {
  de: {
    ruhe: 'Ihre Periode beginnt. Wärme, Ruhe, kein Druck. Sei einfach da.',
    aufwind: 'Ihre Stimmung steigt. Guter Moment für Pläne und ein Date.',
    hochphase: 'Zeig ihr, dass du sie siehst. Nicht wegen des Kalenders – weil du es willst.',
    brandung: 'Brandung kommt. Sei der Fels. Du musst nicht das letzte Wort haben.',
  },
  en: {
    ruhe: 'Her period is starting. Warmth, calm, no pressure. Just be there.',
    aufwind: 'Her mood is rising. A good moment for plans and a date.',
    hochphase: 'Show her that you see her. Not because of the calendar – because you want to.',
    brandung: 'Breakers ahead. Be the rock. You do not need the last word.',
  },
};

export const GESTURE_PUSH: Record<Lang, string> = {
  de: 'Nicht weil der Kalender es sagt. Weil du ein Mann bist, der Acht gibt.',
  en: 'Not because the calendar says so. Because you are a man who pays attention.',
};

/** Neutral mode: the lock screen shows nothing but the app name. */
export const NEUTRAL_TITLE = 'Cyclemax';
