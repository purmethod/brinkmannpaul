// Small helpers shared by the page templates.

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// €29 / €6.19 (en) · 29 € / 6,19 € (de)
export function money(cents, lang) {
  const whole = cents % 100 === 0;
  const n = whole ? String(cents / 100) : (cents / 100).toFixed(2);
  return lang === "de" ? `${n.replace(".", ",")} €` : `€${n}`;
}

// Fill {name} placeholders from an object.
export const fill = (str, vars) => String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

// Strip tags for meta descriptions, aria labels and mail bodies.
export const plain = (html) => String(html).replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// Deterministic random numbers, so every build draws the same illustrations.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const r1 = (n) => Math.round(n * 10) / 10;
