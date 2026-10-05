// Static build: src/ + static/ → public/. Zero dependencies. Run: node scripts/build.mjs
// Vercel runs this on every deploy (vercel.json → buildCommand).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import en from "../src/i18n/en.mjs";
import de from "../src/i18n/de.mjs";
import { layout } from "../src/layout.mjs";
import * as pages from "../src/pages.mjs";
import { favicon } from "../src/art.mjs";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public");
const require = createRequire(import.meta.url);
const site = require("../site.json");
const shop = require("../shop.json");
const routes = require("../routes.json");
delete routes._note;

const T = { en, de };
const PAGES = ["home", "order", "story", "philosophy", "mission", "founders", "tracking", "thanks", "shipping", "imprint", "privacy", "terms", "withdrawal"];

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, "static"), out, { recursive: true });
fs.writeFileSync(path.join(out, "favicon.svg"), favicon);

const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(out, f))).digest("hex").slice(0, 10);
const assets = { css: hash("styles.css"), js: hash("app.js") };
const year = new Date().getFullYear();

function fileFor(route) {
  if (route === "/") return "index.html";
  const rel = route.replace(/^\//, "");
  return Object.values(routes).some((r) => r.home === route) ? path.join(rel, "index.html") : `${rel}.html`;
}

function ctxFor(lang, key) {
  const otherLang = lang === "en" ? "de" : "en";
  return {
    t: T[lang],
    lang,
    key,
    routes,
    site,
    shop,
    assets,
    year,
    other: { t: T[otherLang], routes: routes[otherLang] },
  };
}

let count = 0;
for (const lang of Object.keys(T)) {
  for (const key of PAGES) {
    const ctx = ctxFor(lang, key);
    const html = layout(ctx, pages[key](ctx));
    const file = path.join(out, fileFor(routes[lang][key]));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    count++;
  }
}

// One 404 page for both languages (English first, German below).
{
  const ctx = ctxFor("en", "notFound");
  fs.writeFileSync(path.join(out, "404.html"), layout(ctx, pages.notFound(ctx)));
  count++;
}

// Sitemap with language alternates; thank-you pages stay out.
const indexable = PAGES.filter((k) => k !== "thanks");
const loc = (p) => site.url + (p === "/" ? "/" : p);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${indexable
  .flatMap((k) =>
    Object.keys(T).map(
      (lang) => `  <url>
    <loc>${loc(routes[lang][k])}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${loc(routes.en[k])}"/>
    <xhtml:link rel="alternate" hreflang="de" href="${loc(routes.de[k])}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc(routes.en[k])}"/>
  </url>`
    )
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(out, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`built ${count} pages → public/ (css ${assets.css}, js ${assets.js})`);
