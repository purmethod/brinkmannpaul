import { getLocales } from 'expo-localization';

import type { Lang } from '@/content';

/** German is the default; English only when the device itself prefers English. */
export function detectLanguage(): Lang {
  try {
    for (const locale of getLocales()) {
      if (locale.languageCode === 'de') return 'de';
      if (locale.languageCode === 'en') return 'en';
    }
  } catch {
    // Fall through to the default.
  }
  return 'de';
}
