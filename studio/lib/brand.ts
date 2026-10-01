import fs from 'node:fs';
import path from 'node:path';
import { redis } from './redis';
import type { Brand, BrandTemplate, TemplateSet } from './types';

/*
 * Brand kit = defaults from the repo (brands/<id>/) + overrides changed in the app
 * (redis: settings, blob: uploaded assets like signature.png). The engine only ever
 * talks to this module — later the repo defaults become one row per customer.
 */

const BRANDS_DIR = path.join(process.cwd(), 'brands');

export function defaultBrandId(): string {
  return process.env.BRAND_ID || 'brinkbuild';
}

export const brandKey = (id: string, ...parts: string[]) => ['brand', id, ...parts].join(':');

function brandDir(id: string): string {
  if (!/^[a-z0-9_-]+$/.test(id)) throw new Error(`invalid brand id: ${id}`);
  return path.join(BRANDS_DIR, id);
}

export function listBrandIds(): string[] {
  return fs
    .readdirSync(BRANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(BRANDS_DIR, d.name, 'brand.json')))
    .map((d) => d.name);
}

const fileCache = new Map<string, Buffer | null>();

/** File from the brand kit in the repo, or null when it does not exist (yet). */
export function readBrandFile(id: string, rel: string): Buffer | null {
  const dir = brandDir(id);
  const file = path.join(dir, rel);
  if (!file.startsWith(dir + path.sep)) throw new Error('invalid brand file path');
  if (!fileCache.has(file)) fileCache.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null);
  return fileCache.get(file)!;
}

function readJson<T>(id: string, rel: string): T {
  const buf = readBrandFile(id, rel);
  if (!buf) throw new Error(`brand kit ${id} has no ${rel}`);
  return JSON.parse(buf.toString('utf8')) as T;
}

export function loadBrandDefaults(id = defaultBrandId()): Brand {
  return readJson<Brand>(id, 'brand.json');
}

export function loadTemplates(id = defaultBrandId()): TemplateSet {
  return readJson<TemplateSet>(id, 'templates.json');
}

export function getTemplate(brandId: string, templateId: string): BrandTemplate {
  const tpl = loadTemplates(brandId).templates[templateId];
  if (!tpl) throw new Error(`unknown template: ${templateId}`);
  return tpl;
}

/* ---------- overrides from the app ---------- */

export interface BrandOverrides {
  autoApprove?: boolean;
  assets?: Record<string, string>; // brand file name (e.g. signature.png) -> blob url
}

export async function getOverrides(id: string): Promise<BrandOverrides> {
  return (await redis().get<BrandOverrides>(brandKey(id, 'overrides'))) ?? {};
}

export async function setOverrides(id: string, patch: { autoApprove?: boolean; assets?: Record<string, string | null> }) {
  const cur = await getOverrides(id);
  const assets: Record<string, string> = { ...cur.assets };
  for (const [k, v] of Object.entries(patch.assets ?? {})) {
    if (v) assets[k] = v;
    else delete assets[k];
  }
  const next: BrandOverrides = { ...cur, ...(patch.autoApprove !== undefined ? { autoApprove: patch.autoApprove } : {}), assets };
  await redis().set(brandKey(id, 'overrides'), next);
  return next;
}

export async function getBrand(id = defaultBrandId()): Promise<Brand> {
  const base = loadBrandDefaults(id);
  const o = await getOverrides(id);
  return { ...base, autoApprove: o.autoApprove ?? base.autoApprove };
}

const assetCache = new Map<string, Buffer>();

/** Asset uploaded in the app wins over the file in the repo. */
export async function getBrandAsset(id: string, file: string): Promise<Buffer | null> {
  const url = (await getOverrides(id)).assets?.[file];
  if (url) {
    if (!assetCache.has(url)) {
      const res = await fetch(url);
      if (res.ok) assetCache.set(url, Buffer.from(await res.arrayBuffer()));
    }
    const buf = assetCache.get(url);
    if (buf) return buf;
  }
  return readBrandFile(id, file);
}
