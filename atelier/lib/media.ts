import { id, one, q } from './db';
import type { Media } from './types';

export function isBlobUrl(u: unknown): u is string {
  try {
    const url = new URL(String(u));
    return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export function kindOf(nameOrType: string): 'video' | 'photo' {
  return /video|\.(mov|mp4|m4v|webm|hevc)$/i.test(nameOrType) ? 'video' : 'photo';
}

/** Every medium gets a short running number per brand (#1, #2 …) for voice commands. */
export async function registerMedia(brandId: string, m: { url: string; kind: 'video' | 'photo'; filename?: string; status?: 'uploading' | 'ready' }): Promise<Media> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await one<Media>(
        `insert into media (id, brand_id, number, kind, url, status, filename)
         values ($1, $2, (select coalesce(max(number), 0) + 1 from media where brand_id = $2), $3, $4, $5, $6) returning *`,
        [id('med'), brandId, m.kind, m.url, m.status ?? 'ready', m.filename ?? null],
      );
      return row!;
    } catch (e) {
      if (!/unique|duplicate/i.test((e as Error).message)) throw e;
    }
  }
  throw new Error('could not assign a media number');
}

export async function listMedia(brandId: string, limit = 200): Promise<Media[]> {
  const rows = await q<Media>('select * from media where brand_id = $1 order by number desc limit $2', [brandId, limit]);
  // uploads from the ios shortcut: mark ready once the file exists
  for (const m of rows.filter((r) => r.status === 'uploading')) {
    const ok = await fetch(m.url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
    if (ok) {
      await q("update media set status = 'ready' where id = $1", [m.id]);
      m.status = 'ready';
    }
  }
  return rows;
}

export async function mediaByNumbers(brandId: string, numbers: number[]): Promise<Media[]> {
  const rows = await q<Media>('select * from media where brand_id = $1 and number = any($2::int[])', [brandId, numbers]);
  return numbers.map((n) => rows.find((r) => r.number === n)).filter((m): m is Media => Boolean(m));
}

export async function mediaByIds(ids: string[]): Promise<Media[]> {
  if (!ids.length) return [];
  const rows = await q<Media>('select * from media where id = any($1::text[])', [ids]);
  return ids.map((i) => rows.find((r) => r.id === i)).filter((m): m is Media => Boolean(m));
}
