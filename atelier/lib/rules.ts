import { resolveBrand } from './brand';
import { summarizeRules } from './claude';
import { id, one, q } from './db';
import type { BrandRow, BrandSettings } from './types';

export async function updateSettings(brandId: string, patch: BrandSettings): Promise<BrandRow> {
  return (await one<BrandRow>("update brands set settings = settings || $2::jsonb where id = $1 returning *", [brandId, JSON.stringify(patch)]))!;
}

/** Learning cut: every 5 new feedback notes are folded into the brand's cut rules. */
export async function addFeedback(row: BrandRow, postId: string | null, text: string) {
  await q('insert into edit_feedback (id, brand_id, post_id, text) values ($1,$2,$3,$4)', [id('fb'), row.id, postId, text]);
  const open = await one<{ n: number }>('select count(*)::int as n from edit_feedback where brand_id = $1 and not consumed', [row.id]);
  if ((open?.n ?? 0) >= 5) await learnRules(row).catch(() => undefined);
}

export async function learnRules(row: BrandRow): Promise<string> {
  const fb = await q<{ id: string; text: string }>('select id, text from edit_feedback where brand_id = $1 and not consumed order by created_at', [row.id]);
  const current = resolveBrand(row).cutRules;
  if (!fb.length) return current;
  const rules = await summarizeRules(current, fb.map((f) => f.text));
  await updateSettings(row.id, { cutRules: rules });
  await q('update edit_feedback set consumed = true where id = any($1::text[])', [fb.map((f) => f.id)]);
  return rules;
}
