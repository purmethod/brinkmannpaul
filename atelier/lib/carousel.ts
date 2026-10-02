import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { getSignature, readKitFile } from './brand';
import type { BrandKit, BrandRow, BrandTemplate } from './types';

/* ---------- text format: "|" = new line, "**text**" = bold ---------- */

type Run = { text: string; bold: boolean };
type Word = Run[];
type Line = Word[];

/** One slide per non-empty line; an optional "01 " style prefix is dropped. */
export function splitSlides(text: string | undefined | null): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^\d{2}[.)]?\s+/, ''))
    .filter(Boolean);
}

export function parseSlide(src: string, lowercase: boolean): Line[] {
  const s = lowercase ? src.toLowerCase() : src;
  return s
    .split('|')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const words: Word[] = [];
      let cur: Word = [];
      line.split('**').forEach((part, i) => {
        const bold = i % 2 === 1;
        for (const tok of part.split(/(\s+)/)) {
          if (!tok) continue;
          if (/^\s+$/.test(tok)) {
            if (cur.length) words.push(cur);
            cur = [];
          } else cur.push({ text: tok, bold });
        }
      });
      if (cur.length) words.push(cur);
      return words;
    });
}

export function plainText(src: string): string {
  return src.replace(/\*\*/g, '').split('|').map((l) => l.trim()).join('\n');
}

/* ---------- fitting ---------- */

const GAP = 0.27; // word gap in em

function textHeight(lines: Line[], size: number, maxW: number, lh: number, charW: number) {
  let rows = 0;
  for (const line of lines) {
    rows += 1;
    let x = 0;
    for (const w of line) {
      const ww = w.reduce((a, r) => a + r.text.length * size * (r.bold ? charW * 1.08 : charW), 0);
      if (x > 0 && x + GAP * size + ww > maxW) {
        rows += 1;
        x = ww;
      } else x = x > 0 ? x + GAP * size + ww : ww;
    }
  }
  return rows * size * lh;
}

/** Largest size in [max..min] whose wrapped text fits the box; keeps shrinking rather than clipping. */
function fit(lines: Line[], box: { w: number; h: number }, max: number, min: number, lh: number, charW: number) {
  for (let size = max; size > 24; size -= 2) {
    if (textHeight(lines, size, box.w, lh, charW) <= box.h || size <= Math.min(min, 24)) return size;
  }
  return 24;
}

/* ---------- assets ---------- */

type Img = { src: string; width: number; height: number };
type El = { type: string; props: Record<string, unknown> };

const fontCache = new Map<string, { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' | 'italic' }[]>();

function fonts(kit: string, brand: BrandKit) {
  if (!fontCache.has(kit)) {
    const f = brand.fonts;
    const load = (rel: string) => {
      const buf = readKitFile(kit, rel);
      if (!buf) throw new Error(`font missing in brand kit: ${rel}`);
      return buf;
    };
    fontCache.set(kit, [
      { name: f.family, data: load(f.regular), weight: 400, style: 'normal' },
      { name: f.family, data: load(f.bold), weight: 700, style: 'normal' },
      { name: f.family, data: load(f.italic), weight: 400, style: 'italic' },
      { name: f.sans, data: load(f.sansRegular), weight: 400, style: 'normal' },
      { name: f.sans, data: load(f.sansMedium), weight: 600, style: 'normal' },
      { name: f.sans, data: load(f.sansBold), weight: 700, style: 'normal' },
    ]);
  }
  return fontCache.get(kit)!;
}

const imageCache = new WeakMap<Buffer, Map<string, Img>>();

async function toImg(buf: Buffer, width: number, invert: boolean): Promise<Img> {
  const variant = `${width}:${invert}`;
  const cached = imageCache.get(buf)?.get(variant);
  if (cached) return cached;
  let img = sharp(buf).ensureAlpha();
  if (invert) img = img.negate({ alpha: false });
  const out = await img.resize({ width: width * 2 }).png().toBuffer();
  const meta = await sharp(out).metadata();
  const result = { src: `data:image/png;base64,${out.toString('base64')}`, width, height: Math.round((width * (meta.height ?? width)) / (meta.width ?? width)) };
  if (!imageCache.has(buf)) imageCache.set(buf, new Map());
  imageCache.get(buf)!.set(variant, result);
  return result;
}

export async function loadPhoto(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) return Buffer.from(url.split(',')[1], 'base64');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load photo (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function cover(buf: Buffer, w: number, h: number): Promise<Img> {
  const out = await sharp(buf).rotate().resize(w, h, { fit: 'cover', position: 'attention' }).jpeg({ quality: 90 }).toBuffer();
  return { src: `data:image/jpeg;base64,${out.toString('base64')}`, width: w, height: h };
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const box = (style: Record<string, unknown>, children?: unknown): El => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });
const img = (i: Img, style: Record<string, unknown> = {}): El => ({
  type: 'img',
  props: { src: i.src, width: i.width, height: i.height, style: { width: i.width, height: i.height, ...style } },
});

function textBlock(lines: Line[], o: { size: number; lh: number; color: string; family: string; italic?: boolean; weight?: number; boldWeight?: number; width: number; align?: 'left' | 'center' }) {
  return lines.map((line) =>
    box(
      {
        flexWrap: 'wrap',
        columnGap: Math.round(o.size * GAP),
        width: o.width,
        justifyContent: o.align === 'center' ? 'center' : 'flex-start',
        fontFamily: o.family,
        fontSize: o.size,
        lineHeight: o.lh,
        color: o.color,
        fontStyle: o.italic ? 'italic' : 'normal',
      },
      line.map((word) => box({}, word.map((r) => box({ fontWeight: r.bold ? (o.boldWeight ?? 700) : (o.weight ?? 400) }, r.text)))),
    ),
  );
}

/* ---------- layouts ---------- */

interface Ctx {
  raw: string;
  W: number;
  H: number;
  brand: BrandKit;
  tpl: BrandTemplate;
  lines: Line[];
  photo: Buffer | null;
  index: number;
  total: number;
  signature: (width: number, invert: boolean) => Promise<Img | null>;
}

const counter = (c: Ctx) => (c.total > 1 ? `${String(c.index + 1).padStart(2, '0')} / ${String(c.total).padStart(2, '0')}` : '');

/** Photo in a white polaroid frame on a quiet stone ground; a short line written in the wide bottom field. */
async function polaroid(c: Ctx): Promise<El> {
  const { W, H, tpl, brand } = c;
  const cardW = 864;
  const pad = 40;
  const photoS = cardW - 2 * pad;
  const fieldH = 300;
  const cardH = pad + photoS + fieldH;
  const top = Math.round((H - cardH) / 2) - 10;
  const photo = c.photo
    ? img(await cover(c.photo, photoS, photoS))
    : box({ width: photoS, height: photoS, backgroundColor: '#F1EFEA' });
  const textW = photoS - 80;
  const size = c.lines.length ? fit(c.lines, { w: textW, h: fieldH - 120 }, 44, 30, 1.32, 0.46) : 0;
  const sig = await c.signature(150, false);
  return box({ width: W, height: H, backgroundColor: tpl.background.color, position: 'relative', justifyContent: 'center' }, [
    box(
      {
        position: 'absolute',
        top,
        left: (W - cardW) / 2,
        width: cardW,
        height: cardH,
        backgroundColor: tpl.paper,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: pad,
        boxShadow: '0 2px 3px rgba(0,0,0,0.06), 0 24px 60px rgba(0,0,0,0.10)',
      },
      [
        photo,
        box({ width: photoS, height: fieldH, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }, [
          ...textBlock(c.lines, { size, lh: 1.32, color: tpl.text, family: brand.fonts.family, italic: true, width: textW, align: 'center' }),
          ...(sig ? [img(sig, { position: 'absolute', right: 0, bottom: 28, opacity: 0.85 })] : []),
        ]),
      ],
    ),
    ...(counter(c)
      ? [box({ position: 'absolute', bottom: 40, left: 0, width: W, justifyContent: 'center', fontFamily: brand.fonts.sans, fontSize: 18, letterSpacing: 4, color: rgba(tpl.text, 0.45), fontWeight: 600 }, counter(c))]
      : []),
  ]);
}

/** Full-bleed photo, deep soft gradient, white serif set large and left — a magazine opener. */
async function editorial(c: Ctx): Promise<El> {
  const { W, H, tpl, brand } = c;
  const M = 96;
  const g = tpl.gradient ?? { color: '#000000', maxAlpha: 0.65, heightRatio: 0.6 };
  const textW = W - 2 * M;
  const size = c.lines.length ? fit(c.lines, { w: textW, h: 520 }, 84, 54, 1.12, 0.5) : 0;
  const sig = await c.signature(190, true);
  return box({ width: W, height: H, backgroundColor: tpl.paper, position: 'relative' }, [
    ...(c.photo ? [img(await cover(c.photo, W, H), { position: 'absolute', left: 0, top: 0 })] : []),
    box({
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: W,
      height: Math.round(H * g.heightRatio),
      backgroundImage: `linear-gradient(to top, ${rgba(g.color, g.maxAlpha)}, ${rgba(g.color, g.maxAlpha * 0.55)} 45%, ${rgba(g.color, 0)})`,
    }),
    box({ position: 'absolute', left: 0, top: 0, width: W, height: 220, backgroundImage: `linear-gradient(to bottom, ${rgba('#000000', 0.32)}, ${rgba('#000000', 0)})` }),
    box({ position: 'absolute', top: 72, left: M, right: M, justifyContent: 'flex-end', fontFamily: brand.fonts.sans, fontWeight: 600, fontSize: 20, letterSpacing: 5, color: tpl.text }, counter(c)),
    box(
      { position: 'absolute', left: M, bottom: sig ? 150 + sig.height : 150, width: textW, flexDirection: 'column' },
      [box({ width: 64, height: 3, backgroundColor: tpl.accent, marginBottom: 36 }), ...textBlock(c.lines, { size, lh: 1.12, color: tpl.text, family: brand.fonts.family, width: textW })],
    ),
    ...(sig ? [img(sig, { position: 'absolute', right: M, bottom: 96 })] : []),
  ]);
}

/** Strict grid, generous white, one accent colour, big geometric type. */
async function bauhaus(c: Ctx): Promise<El> {
  const { W, H, tpl, brand } = c;
  const M = 72;
  const innerW = W - 2 * M;
  const photoH = c.photo ? 600 : 0;
  const textTop = c.photo ? 150 + photoH + 72 : 260;
  const textH = H - textTop - 150;
  const textW = innerW - 140;
  const size = c.lines.length ? fit(c.lines, { w: textW, h: textH }, c.photo ? 96 : 112, 46, 1.04, 0.52) : 0;
  const sig = await c.signature(170, false);
  const rule = (y: number) => box({ position: 'absolute', left: M, top: y, width: innerW, height: 2, backgroundColor: tpl.text });
  return box({ width: W, height: H, backgroundColor: tpl.paper, position: 'relative' }, [
    box({ position: 'absolute', top: 68, left: M, width: innerW, justifyContent: 'flex-end', fontFamily: brand.fonts.sans, fontWeight: 600, fontSize: 20, letterSpacing: 4, color: tpl.text }, counter(c)),
    rule(110),
    ...(c.photo ? [img(await cover(c.photo, innerW, photoH), { position: 'absolute', left: M, top: 150 })] : []),
    // accent: a circle on the grid line, the only colour on the page
    box({
      position: 'absolute',
      right: M,
      top: c.photo ? 150 + photoH - 70 : 150,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: tpl.accent,
    }),
    box(
      { position: 'absolute', left: M, top: textTop, width: textW, height: textH, flexDirection: 'column', justifyContent: 'flex-start' },
      textBlock(c.lines, { size, lh: 1.04, color: tpl.text, family: brand.fonts.sans, weight: 600, boldWeight: 700, width: textW }),
    ),
    rule(H - 110),
    box({ position: 'absolute', left: M, top: H - 90, width: 48, height: 12, backgroundColor: tpl.accent }),
    ...(sig ? [img(sig, { position: 'absolute', right: M, bottom: 118 })] : []),
  ]);
}

/** Crop that drifts across the photo from slide to slide — one photo carries a whole carousel. */
async function coverShift(buf: Buffer, w: number, h: number, index: number, total: number): Promise<Img> {
  if (total <= 1) return cover(buf, w, h);
  const zoom = 1.18;
  const big = await sharp(buf).rotate().resize(Math.round(w * zoom), Math.round(h * zoom), { fit: 'cover', position: 'attention' }).toBuffer();
  const t = index / (total - 1);
  const left = Math.round((w * zoom - w) * t);
  const top = Math.round((h * zoom - h) * (0.5 + 0.5 * Math.sin(t * Math.PI)) * 0.6);
  const out = await sharp(big).extract({ left, top, width: w, height: h }).jpeg({ quality: 90 }).toBuffer();
  return { src: `data:image/jpeg;base64,${out.toString('base64')}`, width: w, height: h };
}

/**
 * foyo: full-bleed photo (or a warm dark glow without one), stacked fo/yo lockup top left,
 * counter top right, a large serif truth at the bottom, a plain sans line under it,
 * the follow line on the last slide. Slide text: "headline :: body".
 */
async function foyo(c: Ctx): Promise<El> {
  const { W, H, tpl, brand } = c;
  const M = 76;
  const cream = tpl.text;
  const [headSrc, bodySrc = ''] = c.raw.split('::').map((x) => x.trim());
  const head = parseSlide(headSrc || '', brand.carousel.lowercase);
  const body = brand.carousel.lowercase ? bodySrc.toLowerCase() : bodySrc;
  const last = c.total > 1 && c.index === c.total - 1;
  const cta = last && tpl.cta ? tpl.cta.split('|').map((l) => l.trim()) : [];
  const textW = W - 2 * M - 60;
  const bodyLines = Math.ceil((body.length * 31 * 0.52) / textW) + cta.length * 1.4;
  const headBox = Math.max(260, 600 - bodyLines * 44);
  const size = head.length ? fit(head, { w: textW, h: headBox }, brand.carousel.fontSizeMax, brand.carousel.fontSizeMin, 1.06, 0.5) : 0;
  const glowX = 62 + ((c.index * 9) % 24);
  const g = tpl.gradient ?? { color: '#000000', maxAlpha: 0.75, heightRatio: 0.65 };
  const sans = brand.fonts.sans;
  const shadow = '0 2px 14px rgba(0,0,0,0.38)';
  return box({ width: W, height: H, backgroundColor: tpl.paper, position: 'relative' }, [
    c.photo
      ? img(await coverShift(c.photo, W, H, c.index, c.total), { position: 'absolute', left: 0, top: 0 })
      : box({
          position: 'absolute',
          left: 0,
          top: 0,
          width: W,
          height: H,
          backgroundImage: `radial-gradient(circle at ${glowX}% 34%, rgba(255,244,230,0.62), rgba(255,244,230,0) 38%), radial-gradient(circle at 18% 58%, rgba(92,40,22,0.95), rgba(92,40,22,0) 62%), linear-gradient(160deg, #2a1610, #0d0807)`,
        }),
    box({
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: W,
      height: Math.round(H * g.heightRatio),
      backgroundImage: `linear-gradient(to top, ${rgba(g.color, g.maxAlpha)}, ${rgba(g.color, g.maxAlpha * 0.5)} 50%, ${rgba(g.color, 0)})`,
    }),
    box({ position: 'absolute', left: 0, top: 0, width: W, height: 380, backgroundImage: `linear-gradient(to bottom, ${rgba('#000000', 0.28)}, ${rgba('#000000', 0)})` }),
    // stacked lockup (fo / forever young club / yo), scaled down for longer channel names
    ...(() => {
      const lines = (tpl.logo?.lines ?? []).filter(Boolean).slice(0, 3);
      if (!lines.length) return [];
      const longest = Math.max(...lines.map((l) => l.length));
      const k = Math.min(1, 2.6 / Math.max(2.6, longest * 0.62)) * (lines.length > 2 ? 0.8 : 1);
      const fs = Math.round(138 * k);
      const tagline = tpl.logo?.tagline ?? '';
      const first = box({ fontSize: fs, height: Math.round(112 * k), lineHeight: `${Math.round(112 * k)}px`, letterSpacing: -5 * k }, lines[0]);
      const rest = lines.slice(1).map((l) => box({ fontSize: fs, height: Math.round(100 * k), lineHeight: `${Math.round(56 * k)}px`, letterSpacing: -5 * k }, l));
      const tag = tagline ? [box({ fontSize: 15, height: 20, lineHeight: '20px', fontWeight: 400, marginLeft: -10 * k }, tagline)] : [];
      return [box({ position: 'absolute', left: M - 4, top: 58, flexDirection: 'column', color: cream, fontFamily: sans, fontWeight: 600 }, [first, ...tag, ...rest])];
    })(),
    ...(c.total > 1 ? [box({ position: 'absolute', right: M, top: 74, fontFamily: sans, fontSize: 23, color: cream, letterSpacing: 0.5 }, `${c.index + 1}/${c.total}`)] : []),
    box({ position: 'absolute', left: M, bottom: 110, width: textW, flexDirection: 'column' }, [
      box({ flexDirection: 'column', textShadow: shadow }, textBlock(head, { size, lh: 1.06, color: cream, family: brand.fonts.family, width: textW, boldWeight: 400 })),
      ...(body ? [box({ marginTop: 34, fontFamily: sans, fontSize: 31, lineHeight: 1.36, color: rgba(cream, 0.95), width: textW - 40, textShadow: shadow }, body)] : []),
      ...(cta.length
        ? [box({ marginTop: 22, flexDirection: 'column', fontFamily: sans, fontSize: 31, lineHeight: 1.42, color: rgba(cream, 0.95), textShadow: shadow }, cta.map((l) => box({}, l)))]
        : []),
    ]),
  ]);
}

const LAYOUTS = { polaroid, editorial, bauhaus, foyo };

export async function renderSlide(opts: {
  row: BrandRow;
  brand: BrandKit;
  template: BrandTemplate;
  text: string;
  photoUrl?: string;
  index?: number;
  total?: number;
}): Promise<{ png: Buffer; jpg: Buffer }> {
  const { row, brand, template } = opts;
  const { width: W, height: H } = brand.carousel;
  const sigBuf = await getSignature(row).catch(() => null);
  const ctx: Ctx = {
    raw: opts.text,
    W,
    H,
    brand,
    tpl: template,
    lines: parseSlide(opts.text, brand.carousel.lowercase),
    photo: opts.photoUrl ? await loadPhoto(opts.photoUrl) : null,
    index: opts.index ?? 0,
    total: opts.total ?? 1,
    signature: async (w, inv) => (sigBuf ? toImg(sigBuf, w, inv && template.signature === 'inverted') : null),
  };
  const root = await (LAYOUTS[template.layout] ?? polaroid)(ctx);
  const svg = await satori(root as unknown as Parameters<typeof satori>[0], { width: W, height: H, fonts: fonts(row.kit, brand) });
  const png = Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
  const jpg = await sharp(png).flatten({ background: '#ffffff' }).jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toBuffer();
  return { png, jpg };
}
