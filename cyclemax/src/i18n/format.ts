import type { Lang } from '@/content';
import { atLocalTime, type ISODate } from '@/engine';

const LOCALE: Record<Lang, string> = { de: 'de-DE', en: 'en-GB' };

export function localeOf(lang: Lang): string {
  return LOCALE[lang];
}

/** "Fr., 2. Okt." / "Fri 2 Oct" */
export function formatDate(iso: ISODate, lang: Lang): string {
  try {
    return atLocalTime(iso, 12, 0).toLocaleDateString(LOCALE[lang], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
