import fs from 'node:fs';
import path from 'node:path';
import type { Brand, BrandTemplate, TemplateSet } from './types';

const BRANDS_DIR = path.join(process.cwd(), 'brands');

export function defaultBrandId(): string {
  return process.env.BRAND_ID || 'brinkbuild';
}

function brandDir(id: string): string {
  if (!/^[a-z0-9_-]+$/.test(id)) throw new Error(`invalid brand id: ${id}`);
  return path.join(BRANDS_DIR, id);
}

const cache = new Map<string, unknown>();

function readJson<T>(file: string): T {
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(file, 'utf8')));
  return cache.get(file) as T;
}

export function loadBrand(id = defaultBrandId()): Brand {
  return readJson<Brand>(path.join(brandDir(id), 'brand.json'));
}

export function loadTemplates(id = defaultBrandId()): TemplateSet {
  return readJson<TemplateSet>(path.join(brandDir(id), 'templates.json'));
}

export function getTemplate(brandId: string, templateId: string): BrandTemplate {
  const set = loadTemplates(brandId);
  const tpl = set.templates[templateId];
  if (!tpl) throw new Error(`unknown template: ${templateId}`);
  return tpl;
}

/** Returns file contents or null when the brand kit does not (yet) contain the file. */
export function readBrandFile(id: string, rel: string): Buffer | null {
  const file = path.join(brandDir(id), rel);
  if (!file.startsWith(brandDir(id))) throw new Error('invalid brand file path');
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}
