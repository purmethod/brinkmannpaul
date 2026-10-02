import { NextResponse } from 'next/server';
import { getCtx } from '@/lib/auth';
import { safeEqual, sign } from '@/lib/crypto';
import { appOrigin } from '@/lib/origin';
import { saveConnection } from '@/lib/platforms';
import { instagram } from '@/lib/platforms/instagram';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = appOrigin(req);
  const ctx = await getCtx();
  if (!ctx) return NextResponse.redirect(`${origin}/login`);
  const back = (msg: string) => NextResponse.redirect(`${origin}/channels/${ctx.brand.id}?instagram=${encodeURIComponent(msg)}`);
  const [brandId, ts, sig] = (url.searchParams.get('state') || '').split('.');
  if (!sig || brandId !== ctx.brand.id || Date.now() - Number(ts) > 3600_000 || !safeEqual(sig, sign(`ig:${brandId}.${ts}`))) return back('invalid state, try again');
  if (url.searchParams.get('error')) return back(url.searchParams.get('error_description') || 'canceled');
  try {
    const data = await instagram.handleCallback(url.searchParams.get('code') || '', `${origin}/api/auth/instagram/callback`);
    await saveConnection(ctx.brand.id, 'instagram', data);
    return back(`connected @${data.username ?? data.accountId}`);
  } catch (e) {
    return back((e as Error).message);
  }
}
