// Text similarity for the duplicate check of generated lines (no dependencies).

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(text: string): Set<string> {
  const t = ` ${normalize(text)} `;
  const out = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}

function words(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** 0..1 – max of character-trigram and word Jaccard similarity. */
export function similarity(a: string, b: string): number {
  return Math.max(jaccard(trigrams(a), trigrams(b)), jaccard(words(a), words(b)));
}

export const DUPLICATE_THRESHOLD = 0.6;

export function isDuplicate(text: string, existing: Iterable<string>, threshold = DUPLICATE_THRESHOLD): boolean {
  const n = normalize(text);
  for (const e of existing) {
    if (normalize(e) === n || similarity(text, e) >= threshold) return true;
  }
  return false;
}
