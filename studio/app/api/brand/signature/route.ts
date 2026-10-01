import { defaultBrandId, getBrand, getBrandAsset } from '@/lib/brand';

export const dynamic = 'force-dynamic';

// current signature (uploaded in the app, else the repo file) for the brand page preview
export async function GET() {
  const id = defaultBrandId();
  const brand = await getBrand(id);
  const buf = await getBrandAsset(id, brand.signature.file);
  if (!buf) return new Response('no signature', { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { 'content-type': 'image/png', 'cache-control': 'no-store' } });
}
