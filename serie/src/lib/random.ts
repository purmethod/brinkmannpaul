// Deterministische Pseudo-Zufallswerte (gleiches Ergebnis bei jedem Render).

export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Mulberry32 — kleiner, schneller Seeded-RNG. */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Einzelner Zufallswert 0..1 aus beliebigen Schlüsseln. */
export const rand = (...keys: (string | number)[]) =>
  rng(hashString(keys.join('|')))();

/** Glattes 1D-Rauschen (Value-Noise), Ausgabe -1..1. */
export const noise1 = (x: number, salt = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = rand('n', salt, i) * 2 - 1;
  const b = rand('n', salt, i + 1) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
