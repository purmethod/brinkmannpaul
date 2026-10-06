// Above-the-fold screenshots at several sizes. Usage: node fold.mjs <outdir> <path> [WxH ...]
import { chromium } from "playwright";
const [outdir, p, ...sizes] = process.argv.slice(2);
const base = process.env.BASE || "http://localhost:3000";
const b = await chromium.launch();
for (const s of sizes) {
  const [w, h] = s.split("x").map(Number);
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outdir}/fold-${p.replace(/\//g, "_")}-${s}.png` });
  await ctx.close();
}
await b.close();
