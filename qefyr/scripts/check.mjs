// Pre-push check: syntax, fresh build, every local link and asset, asset budget, copy rules,
// and the launch blockers that only Paul can fill in. Run: node scripts/check.mjs
// Exit code 1 on errors. Launch blockers are warnings unless you pass --strict.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const pub = path.join(root, "public");
const require = createRequire(import.meta.url);
const strict = process.argv.includes("--strict");
const errors = [];
const blockers = [];

// 1. Syntax of every script.
const scripts = [
  ...fs.readdirSync(path.join(root, "api")).map((f) => `api/${f}`),
  ...fs.readdirSync(path.join(root, "scripts")).map((f) => `scripts/${f}`),
  ...fs.readdirSync(path.join(root, "src")).filter((f) => f.endsWith(".mjs")).map((f) => `src/${f}`),
  "src/i18n/en.mjs",
  "src/i18n/de.mjs",
  "static/app.js",
];
for (const f of scripts) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" });
  } catch (err) {
    errors.push(`syntax: ${f}\n${err.stderr}`);
  }
}

// 2. Fresh build.
execFileSync(process.execPath, [path.join(root, "scripts/build.mjs")], { stdio: "pipe" });

// 3. Every local href/src in every built page must resolve (clean URLs like Vercel).
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(pub).filter((f) => f.endsWith(".html"));
const exists = (urlPath) => {
  const p = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  if (p === "/") return fs.existsSync(path.join(pub, "index.html"));
  const base = path.join(pub, p);
  return [base, base + ".html", path.join(base, "index.html")].some((f) => fs.existsSync(f) && fs.statSync(f).isFile());
};
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(pub, file);
  for (const [, ref] of html.matchAll(/(?:href|src|action)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    if (ref.startsWith("/api/")) continue;
    if (!ref.startsWith("/")) {
      errors.push(`${rel}: relative link "${ref}" (use absolute paths)`);
      continue;
    }
    if (!exists(ref)) errors.push(`${rel}: missing ${ref}`);
  }
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${rel}: ${h1} <h1> elements (want exactly 1)`);
  if (!/<title>[^<]{10,}<\/title>/.test(html)) errors.push(`${rel}: missing or short <title>`);
  if (!/<meta name="description" content="[^"]{10,}"/.test(html)) errors.push(`${rel}: missing meta description`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) errors.push(`${rel}: duplicate ids ${[...new Set(dup)].join(", ")}`);
  if (/\{[a-z]+\}/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) errors.push(`${rel}: unfilled {placeholder} in page`);
}

// 4. Asset budget: 300 KB per file (fonts and images included).
for (const f of walk(pub)) {
  const kb = fs.statSync(f).size / 1024;
  if (kb > 300) errors.push(`${path.relative(pub, f)} is ${Math.round(kb)} KB (> 300 KB)`);
}

// 5. Copy rules: brand always lowercase "qefyr"; no health claims; no lorem/TODO.
const copyFiles = ["src/i18n/en.mjs", "src/i18n/de.mjs", "src/legal.mjs", "src/pages.mjs"];
const banned = [
  [/\bQefyr\b|\bQEFYR\b/, 'brand is written "qefyr"'],
  [/probiotic|probiotisch/i, '"probiotic" is an unauthorised health claim in the EU'],
  [/immun|immune|verdauung|digestion|darmflora|gut health|heilt|heals|cures|gesund(?!heit)/i, "health claim (EU 1924/2006)"],
  [/lorem|ipsum|\bTODO\b|FIXME/i, "placeholder text"],
];
for (const f of copyFiles) {
  fs.readFileSync(path.join(root, f), "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (line.includes("check:allow")) return;
      for (const [re, why] of banned) if (re.test(line)) errors.push(`${f}:${i + 1} ${why}: ${line.trim().slice(0, 90)}`);
    });
}

// 6. Launch blockers: details only Paul can provide.
const site = require("../site.json");
const shop = require("../shop.json");
const optional = new Set(["represented_by", "privacy_contact"]);
for (const [k, v] of Object.entries(site.legal)) {
  if (v === null && !optional.has(k)) {
    if (k === "vat_id" && site.legal.small_business === true) continue;
    blockers.push(`site.json legal.${k} is empty`);
  }
}
if (!shop.product.volume_ml) blockers.push("shop.json product.volume_ml is empty (net quantity and price per litre are required by law)");

if (errors.length) {
  console.error(`FAIL (${errors.length})\n- ` + errors.join("\n- "));
}
if (blockers.length) {
  console.warn(`\nLAUNCH BLOCKERS (${blockers.length}), see LAUNCH.md:\n- ` + blockers.join("\n- "));
}
if (errors.length || (strict && blockers.length)) process.exit(1);
console.log(`\nPASS: ${scripts.length} scripts, ${pages.length} pages, links, assets, copy rules.`);
