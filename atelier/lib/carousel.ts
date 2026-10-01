import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { getSignature, readKitFile } from './brand';
import type { BrandKit, BrandRow, BrandTemplate } from './types';

/* ---------- slide text format: "|" = new line, "**text**" = bold ---------- */

type Run = { text: string; bold: boolean };
type Word = Run[];
type Line = Word[];

/** One slide per non-empty line; an optional "01 " style prefix is dropped. */
export function splitSlides(text: string | undefined): string[] {
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

function wordWidth(w: Word, size: number) {
  return w.reduce((acc, r) => acc + r.text.length * size * (r.bold ? 0.57 : 0.53), 0);
}

function textHeight(lines: Line[], size: number, maxW: number, lh: number) {
  let rows = 0;
  for (const line of lines) {
    rows += 1;
    let x = 0;
    for (const w of line) {
      const ww = wordWidth(w, size);
      if (x > 0 && x + GAP * size + ww > maxW) {
        rows += 1;
        x = ww;
      } else x = x > 0 ? x + GAP * size + ww : ww;
    }
  }
  return rows * size * lh;
}

function pickSize(lines: Line[], maxW: number, maxH: number, brand: BrandKit) {
  const { fontSizeMax, fontSizeMin, lineHeight } = brand.carousel;
  for (let size = fontSizeMax; size >= fontSizeMin; size -= 2) {
    if (textHeight(lines, size, maxW, lineHeight) <= maxH) return size;
  }
  // overflow fallback: keep going down rather than clipping text
  for (let size = fontSizeMin - 2; size > 40; size -= 2) {
    if (textHeight(lines, size, maxW, lineHeight) <= maxH) return size;
  }
  return 40;
}

/* ---------- assets ---------- */

const fontCache = new Map<string, { regular: Buffer; bold: Buffer }>();

function fonts(kit: string, brand: BrandKit) {
  if (!fontCache.has(kit)) {
    const regular = readKitFile(kit, brand.fonts.regular);
    const bold = readKitFile(kit, brand.fonts.bold);
    if (!regular || !bold) throw new Error(`fonts missing in brand kit ${kit}`);
    fontCache.set(kit, { regular, bold });
  }
  return fontCache.get(kit)!;
}

type Img = { src: string; width: number; height: number };

const imageCache = new WeakMap<Buffer, Map<string, Img>>();

async function toImg(buf: Buffer, width: number, invert: boolean): Promise<Img> {
  const variant = `${width}:${invert}`;
  const cached = imageCache.get(buf)?.get(variant);
  if (cached) return cached;
  let img = sharp(buf).ensureAlpha();
  if (invert) img = img.negate({ alpha: false });
  const out = await img.resize({ width: width * 2 }).png().toBuffer();
  const meta = await sharp(out).metadata();
  const height = Math.round((width * (meta.height ?? width)) / (meta.width ?? width));
  const result = { src: `data:image/png;base64,${out.toString('base64')}`, width, height };
  if (!imageCache.has(buf)) imageCache.set(buf, new Map());
  imageCache.get(buf)!.set(variant, result);
  return result;
}

async function photoBackground(url: string, w: number, h: number): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load photo ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const out = await sharp(buf).rotate().resize(w, h, { fit: 'cover', position: 'attention' }).jpeg({ quality: 90 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString('base64')}`;
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/* ---------- render ---------- */

type El = { type: string; props: Record<string, unknown> };
const box = (style: Record<string, unknown>, children?: unknown): El => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});
const img = (i: Img, style: Record<string, unknown>): El => ({
  type: 'img',
  props: { src: i.src, width: i.width, height: i.height, style: { width: i.width, height: i.height, ...style } },
});

export async function renderSlide(opts: {
  row: BrandRow;
  brand: BrandKit;
  template: BrandTemplate;
  text: string;
  photoUrl?: string;
}): Promise<{ png: Buffer; jpg: Buffer }> {
  const { row, brand, template, text, photoUrl } = opts;
  const { width: W, height: H, margin: M, lineHeight } = brand.carousel;
  const sigCfg = brand.carousel.signature;

  const sigBuf = await getSignature(row);
  const signature = sigBuf ? await toImg(sigBuf, sigCfg.width, template.signature === 'inverted') : null;
  const logoBuf = template.logo ? readKitFile(row.kit, template.logo.file) : null;
  const logo = logoBuf && template.logo ? await toImg(logoBuf, template.logo.width, false) : null;

  const children: El[] = [];
  if (photoUrl) {
    children.push(img({ src: await photoBackground(photoUrl, W, H), width: W, height: H }, { position: 'absolute', left: 0, top: 0 }));
  }
  if (photoUrl && template.gradient) {
    const g = template.gradient;
    children.push(
      box({
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: W,
        height: Math.round(H * g.heightRatio),
        backgroundImage: `linear-gradient(to top, ${rgba(g.color, g.maxAlpha)}, ${rgba(g.color, 0)})`,
      }),
    );
  }

  const lines = parseSlide(text, brand.carousel.lowercase);
  if (lines.length) {
    const sigZone = signature ? sigCfg.margin + signature.height + 50 : M;
    const padBottom = Math.max(M, sigZone);
    const maxW = W - 2 * M;
    const size = pickSize(lines, maxW, H - M - padBottom, brand);
    children.push(
      box(
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: W,
          height: H,
          flexDirection: 'column',
          justifyContent: template.carousel.valign === 'bottom' ? 'flex-end' : 'center',
          padding: `${M}px ${M}px ${padBottom}px ${M}px`,
          fontFamily: brand.fonts.family,
          color: template.text,
          fontSize: size,
          lineHeight,
        },
        lines.map((line) =>
          box(
            { flexWrap: 'wrap', columnGap: Math.round(size * GAP), width: maxW },
            line.map((word) => box({}, word.map((r) => box({ fontWeight: r.bold ? 700 : 400 }, r.text)))),
          ),
        ),
      ),
    );
  }

  if (logo && template.logo && photoUrl) {
    children.push(img(logo, { position: 'absolute', left: template.logo.x, top: template.logo.y }));
  }
  if (signature) {
    children.push(img(signature, { position: 'absolute', right: sigCfg.margin, bottom: sigCfg.margin }));
  }

  const root = box(
    { width: W, height: H, position: 'relative', backgroundColor: template.background.color },
    children,
  );

  const f = fonts(row.kit, brand);
  const svg = await satori(root as unknown as Parameters<typeof satori>[0], {
    width: W,
    height: H,
    fonts: [
      { name: brand.fonts.family, data: f.regular, weight: 400, style: 'normal' },
      { name: brand.fonts.family, data: f.bold, weight: 700, style: 'normal' },
    ],
  });
  const png = Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
  const jpg = await sharp(png).flatten({ background: '#ffffff' }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
  return { png, jpg };
}
