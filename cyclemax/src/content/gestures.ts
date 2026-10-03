import type { Lang } from './types';

export type GestureId = 'flowers' | 'date' | 'letter' | 'surprise' | 'time';

export const GESTURE_ORDER: readonly GestureId[] = ['flowers', 'date', 'letter', 'surprise', 'time'];

/** Default reminder intervals in weeks (changeable in Settings). */
export const DEFAULT_GESTURE_INTERVALS: Record<GestureId, number> = {
  flowers: 8,
  date: 3,
  letter: 4,
  surprise: 6,
  time: 2,
};

export const GESTURE_INTERVAL_RANGE = { min: 1, max: 16 } as const;

export const GESTURE_NAMES: Record<Lang, Record<GestureId, string>> = {
  de: {
    flowers: 'Blumen',
    date: 'Date geplant',
    letter: 'Brief oder Nachricht',
    surprise: 'Überraschung',
    time: 'Zeit nur für sie',
  },
  en: {
    flowers: 'Flowers',
    date: 'Date planned',
    letter: 'Letter or message',
    surprise: 'Surprise',
    time: 'Time just for her',
  },
};
