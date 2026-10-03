/**
 * URL of the coach proxy (server/, deployed on Vercel). Set at build time:
 *   EXPO_PUBLIC_COACH_URL=https://<your-project>.vercel.app
 * Without it the coach answers offline with impulses from the phase content.
 */
export const COACH_URL: string | undefined = process.env.EXPO_PUBLIC_COACH_URL;
