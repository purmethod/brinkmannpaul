import { NextResponse } from 'next/server';
import { requireCtx, route } from '@/lib/auth';
import { sign } from '@/lib/crypto';
import { appOrigin } from '@/lib/origin';
import { instagram } from '@/lib/platforms/instagram';

// "connect instagram": facebook login for business
export const GET = route(async (req: Request) => {
  const { brand } = await requireCtx();
  const payload = `${brand.id}.${Date.now()}`;
  const state = `${payload}.${sign(`ig:${payload}`)}`;
  return NextResponse.redirect(instagram.authorizeUrl(state, `${appOrigin(req)}/api/auth/instagram/callback`));
});
