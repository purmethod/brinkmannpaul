import { NextResponse } from 'next/server';
import { defaultBrandId } from '@/lib/brand';
import { getIgAccount } from '@/lib/instagram';
import { setupChecks } from '@/lib/setup';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ checks: await setupChecks(defaultBrandId()) });
}

// "test instagram": calls GET /me with the stored token and saves the account id
export async function POST() {
  try {
    const account = await getIgAccount(defaultBrandId(), true);
    return NextResponse.json({ account });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
