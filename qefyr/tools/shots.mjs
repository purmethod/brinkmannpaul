// Full-page screenshots for visual review. Usage: node shots.mjs <outdir> <path...>  (BASE env, default http://localhost:3000)
import { chromium } from "playwright";
import fs from "node:fs";
const [outdir, ...paths] = process.argv.slice(2);
const base = process.env.BASE || "http://localhost:3000";
const views = (process.env.VIEWS || "desktop,mobile").split(",");
const VP = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
fs.mkdirSync(outdir, { recursive: true });
const browser = await chromium.launch();
for (const v of views) {
  const { width, height, ...rest } = VP[v];
  const ctx = await browser.newContext({ viewport: { width, height }, ...rest });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log(`[${v}] console.${m.type()}:`, m.text()); });
  page.on("pageerror", (e) => console.log(`[${v}] pageerror:`, e.message));
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")); const d = document.querySelector("[data-dock]"); if (d) d.style.display = "none";
      await document.fonts.ready;
    });
    if (process.env.SCROLL) await page.evaluate((y) => window.scrollTo(0, Number(y)), process.env.SCROLL);
    await page.waitForTimeout(500);
    const name = `${v}-${p.replace(/\//g, "_") || "_"}.png`;
    await page.screenshot({ path: `${outdir}/${name}`, fullPage: !process.env.VIEWPORT_ONLY });
    console.log("shot", name);
  }
  await ctx.close();
}
await browser.close();
