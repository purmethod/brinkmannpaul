import { NextResponse } from 'next/server';
import { defaultBrandId, getBrand, getOverrides, setOverrides } from '@/lib/brand';
import { isBlobUrl } from '@/lib/posts';

export async function GET() {
  const id = defaultBrandId();
  const brand = await getBrand(id);
  return NextResponse.json({ id, autoApprove: brand.autoApprove, signatureFile: brand.signature.file, overrides: await getOverrides(id) });
}

/** Body: { autoApprove?: boolean, signatureUrl?: string | null } — null = back to the repo file */
export async function PATCH(req: Request) {
  const id = defaultBrandId();
  const brand = await getBrand(id);
  const body = (await req.json().catch(() => ({}))) as { autoApprove?: unknown; signatureUrl?: unknown };
  const patch: { autoApprove?: boolean; assets?: Record<string, string | null> } = {};
  if (typeof body.autoApprove === 'boolean') patch.autoApprove = body.autoApprove;
  if (body.signatureUrl === null) patch.assets = { [brand.signature.file]: null };
  else if (body.signatureUrl !== undefined) {
    if (!isBlobUrl(body.signatureUrl)) return NextResponse.json({ error: 'invalid signature url' }, { status: 400 });
    patch.assets = { [brand.signature.file]: body.signatureUrl };
  }
  return NextResponse.json({ overrides: await setOverrides(id, patch) });
}
