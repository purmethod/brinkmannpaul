import { NextResponse } from 'next/server';
import { requireCtx, route } from '@/lib/auth';
import { sign } from '@/lib/crypto';
import { appOrigin } from '@/lib/origin';
import { instagram } from '@/lib/platforms/instagram';

// "connect instagram" for the active channel: instagram login (business / creator accounts)
export const GET = route(async (req: Request) => {
  const { brand } = await requireCtx();
  const origin = appOrigin(req);
  const payload = `${brand.id}.${Date.now()}`;
  const state = `${payload}.${sign(`ig:${payload}`)}`;
  try {
    return NextResponse.redirect(instagram.authorizeUrl(state, `${origin}/api/auth/instagram/callback`));
  } catch (e) {
    // not set up yet: back to the channel with a readable reason instead of a json page
    return NextResponse.redirect(`${origin}/channels/${brand.id}?instagram=${encodeURIComponent((e as Error).message)}`);
  }
});
