import type { Platform } from './types';

/** Prepared, not built: TikTok Content Posting API (direct post) slots in here. */
const notYet = () => {
  throw new Error('tiktok is not available yet');
};

export const tiktok: Platform = {
  id: 'tiktok',
  label: 'tiktok',
  available: false,
  authorizeUrl: notYet,
  handleCallback: async () => notYet(),
  refresh: async () => null,
  publish: async () => notYet(),
};
