import fs from 'node:fs';
import path from 'node:path';
import type { BrandKit, BrandRow, BrandTemplate, TemplateSet } from './types';

/*
 * Brand kit = defaults from the repo (brands/<kit>/: fonts, templates, layout) merged with
 * the brand's settings row (autoApprove, rules, signature, language). The engine only reads
 * brands through this module, so a customer's kit can later live entirely in the database.
 */

const KITS_DIR = path.join(process.cwd(), 'brands');

function kitDir(kit: string) {
  if (!/^[a-z0-9_-]+$/.test(kit)) throw new Error(`invalid kit: ${kit}`);
  return path.join(KITS_DIR, kit);
}

const files = new Map<string, Buffer | null>();
export function readKitFile(kit: string, rel: string): Buffer | null {
  const dir = kitDir(kit);
  const file = path.join(dir, rel);
  if (!file.startsWith(dir + path.sep)) throw new Error('invalid kit path');
  if (!files.has(file)) files.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null);
  return files.get(file)!;
}

function json<T>(kit: string, rel: string): T {
  const buf = readKitFile(kit, rel);
  if (!buf) throw new Error(`kit ${kit} has no ${rel}`);
  return JSON.parse(buf.toString('utf8')) as T;
}

/** Every kit folder in brands/ (one per account the owner runs). */
export function listKits(): string[] {
  return fs
    .readdirSync(KITS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[a-z0-9_-]+$/.test(d.name) && fs.existsSync(path.join(KITS_DIR, d.name, 'brand.json')))
    .map((d) => d.name)
    .sort();
}

export function loadKit(kit: string): BrandKit {
  return json<BrandKit>(kit, 'brand.json');
}

export function loadTemplates(kit: string): TemplateSet {
  return json<TemplateSet>(kit, 'templates.json');
}

export function templateList(kit: string) {
  const set = loadTemplates(kit);
  const max = loadKit(kit).maxTemplates ?? 5;
  return Object.entries(set.templates)
    .slice(0, max)
    .map(([id, t]) => ({ id, label: t.label, media: t.background.type === 'media' }));
}

export function getTemplate(kit: string, templateId: string): BrandTemplate {
  const tpl = loadTemplates(kit).templates[templateId];
  if (!tpl) throw new Error(`unknown template: ${templateId}`);
  return tpl;
}

/** Effective brand: repo defaults + settings from the app. */
export function resolveBrand(row: BrandRow): BrandKit & { rowId: string } {
  const kit = loadKit(row.kit);
  const s = row.settings ?? {};
  const ch = s.channel ?? {};
  return {
    ...kit,
    rowId: row.id,
    name: ch.name || row.name || kit.name,
    handle: ch.handle || kit.handle,
    brief: ch.brief || kit.brief,
    tone: ch.tone || kit.tone,
    autoApprove: s.autoApprove ?? kit.autoApprove,
    cutRules: s.cutRules ?? kit.cutRules,
    subtitleLanguage: s.subtitleLanguage ?? kit.subtitleLanguage,
    defaultTemplate: s.defaultTemplate ?? kit.defaultTemplate,
    caption: { ...kit.caption, rules: s.captionRules ? s.captionRules.split('\n').filter(Boolean) : kit.caption.rules },
  };
}

/** A channel's own logo and closing line on top of the kit's template. */
export function channelTemplate(row: BrandRow, tpl: BrandTemplate): BrandTemplate {
  const ch = row.settings?.channel;
  if (!ch) return tpl;
  return {
    ...tpl,
    ...(ch.cta !== undefined ? { cta: ch.cta } : {}),
    ...(ch.logo?.length ? { logo: { lines: ch.logo, tagline: ch.tagline ?? '' } } : {}),
  };
}

const remote = new Map<string, Buffer>();

/** Signature: uploaded in the app wins over brands/<kit>/signature.png. */
export async function getSignature(row: BrandRow): Promise<Buffer | null> {
  const url = row.settings?.signatureUrl;
  if (url) {
    if (!remote.has(url)) {
      const res = await fetch(url);
      if (res.ok) remote.set(url, Buffer.from(await res.arrayBuffer()));
    }
    if (remote.has(url)) return remote.get(url)!;
  }
  return readKitFile(row.kit, loadKit(row.kit).signature.file);
}
