// Renders the share image, the Stripe product image and the app icons from the code-drawn art.
// Run from tools/: npm run images   (writes into ../static/img and ../static)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { glass, favicon } from "../src/art.mjs";

const root = path.resolve(import.meta.dirname, "..");
const img = path.join(root, "static", "img");
fs.mkdirSync(img, { recursive: true });
const font = (f) => "file://" + path.join(root, "static", "fonts", f);

const base = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;src:url(${font("fraunces-opsz.woff2")}) format("woff2");font-weight:100 900}
@font-face{font-family:Fraunces;src:url(${font("fraunces-opsz-italic.woff2")}) format("woff2");font-weight:100 900;font-style:italic}
*{box-sizing:border-box;margin:0}
body{background:radial-gradient(110% 90% at 72% 40%,#2d4436 0%,#22332a 40%,#1c2a21 78%);color:#f4eee1;font-family:-apple-system,Helvetica,Arial,sans-serif;overflow:hidden}
.serif{font-family:Fraunces,Georgia,serif;font-optical-sizing:auto}
em{font-style:italic;color:#b08d57}
</style>`;

const pages = {
  "og.png": {
    size: [1200, 630],
    html: `${base}<body style="width:1200px;height:630px;display:grid;grid-template-columns:1fr 470px;align-items:center;padding:0 40px 0 90px">
      <div>
        <p style="font-size:15px;font-weight:650;letter-spacing:.24em;text-transform:uppercase;color:#b08d57">living kefir · made in germany</p>
        <p class="serif" style="font-size:150px;font-weight:300;letter-spacing:-.03em;line-height:1;margin-top:18px">qefyr</p>
        <p class="serif" style="font-size:44px;font-weight:300;line-height:1.1;margin-top:20px">real kefir grains.<br><em>ready to drink.</em></p>
      </div>
      <div style="width:470px;margin-top:70px">${glass({ shadow: true })}</div>
    </body>`,
  },
  "product.png": {
    size: [800, 800],
    html: `${base}<body style="width:800px;height:800px;display:grid;place-items:center"><div style="width:600px;margin-top:40px">${glass()}</div></body>`,
  },
  "icon-512.png": { size: [512, 512], html: `<!doctype html><style>*{margin:0}body{width:512px;height:512px}svg{width:512px;height:512px}</style>${favicon.replace('rx="14"', 'rx="0"')}` },
  "icon-180.png": { size: [180, 180], html: `<!doctype html><style>*{margin:0}body{width:180px;height:180px}svg{width:180px;height:180px}</style>${favicon.replace('rx="14"', 'rx="0"')}` },
  "icon-32.png": { size: [32, 32], html: `<!doctype html><style>*{margin:0}body{width:32px;height:32px}svg{width:32px;height:32px}</style>${favicon}` },
};

const browser = await chromium.launch();
for (const [name, { size, html }] of Object.entries(pages)) {
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(img, name), omitBackground: name.startsWith("icon-32") });
  await page.close();
  console.log("rendered", name);
}
await browser.close();

// Compress PNGs and build favicon.ico (ImageMagick, if installed).
try {
  for (const f of ["og.png", "product.png"]) {
    execFileSync("convert", [path.join(img, f), "-strip", "-quality", "92", "-define", "png:compression-level=9", path.join(img, f)]);
  }
  execFileSync("convert", [path.join(img, "icon-32.png"), path.join(root, "static", "favicon.ico")]);
  fs.rmSync(path.join(img, "icon-32.png"));
  console.log("favicon.ico written");
} catch (err) {
  console.warn("ImageMagick not available, skipped compression/favicon.ico:", err.message);
}
