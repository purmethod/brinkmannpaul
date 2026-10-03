import type { PhaseId } from '@/engine';

export const colors = {
  background: '#FFFFFF',
  surface: '#F5F5F4',
  text: '#0B0B0C',
  textSecondary: '#6B6B6B',
  accent: '#8A0303',
  hairline: '#E4E4E2',
  ringTrack: '#ECECEA',
} as const;

/** Phase colours, used for the ring and small markers only (never as text colour → contrast). */
export const phaseColors: Record<PhaseId, string> = {
  ruhe: '#C8102E',
  aufwind: '#2E9E4F',
  hochphase: '#E83E8C',
  brandung: '#F2B705',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 } as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1 },
  title: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  lead: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.6 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
} as const;
