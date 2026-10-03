import type { GestureId } from '@/engine';

import type { Lang } from './types';

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
