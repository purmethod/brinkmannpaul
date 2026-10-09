// App Store marketing frames: headline + real screenshot on white, 1290×2796 (6.9" slot).
// Run after `npm run screenshots`: node scripts/store-frames.mjs
import { mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const font = readFileSync(join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).toString("base64");
const FRAMES = [
  ["04-heute-standfest", "Sie tickt in 28 Tagen.<br>Du in 24 Stunden.", "Cyclemax sagt dir vorher, was kommt."],
  ["05-verstehen", "Du musst es nicht ändern.<br>Du musst es kennen.", "Die nächsten Phasen – mit Datum."],
  ["06-verstehen-standfest", "Wenn sie lauter wird,<br>wirst du ruhiger.", "Ruhiger heißt nicht kleiner."],
  ["07-chat", "„Was soll ich sagen?“", "Du bekommst den Satz. Per Sprache oder Text."],
  ["02-onboarding", "Sei der Fels<br>in der Brandung.", "Fundament: PURE Method und die Stoa."],
  ["09-profil", "Dein Standard.<br>Nicht ihr Applaus.", "Erzähl frei – Cyclemax coacht dich."],
  ["10-heute-waerme", "Ein Tap.<br>Cyclemax übernimmt.", "Keine Aufgabe. Kein Konto. Alles auf deinem Gerät."],
];

const out = join(root, "store/screenshots/framed");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1290, height: 2796 }, deviceScaleFactor: 1 });
for (const [i, [file, title, sub]] of FRAMES.entries()) {
  const shot = readFileSync(join(root, `store/screenshots/6.7/${file}.png`)).toString("base64");
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: Inter; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 100 900; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1290px; height: 2796px; background: #fff; font-family: Inter, sans-serif; color: #0b0b0c;
      display: flex; flex-direction: column; align-items: center; padding-top: 170px; overflow: hidden; }
    h1 { font-size: 96px; line-height: 1.08; font-weight: 650; letter-spacing: -0.03em; text-align: center; }
    p { margin-top: 44px; font-size: 46px; color: #6b6b6b; text-align: center; }
    .phone { margin-top: 110px; width: 1010px; border-radius: 72px; overflow: hidden; border: 14px solid #0b0b0c; }
    .phone img { display: block; width: 100%; }
  </style></head><body><h1>${title}</h1><p>${sub}</p><div class="phone"><img src="data:image/png;base64,${shot}"></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${String(i + 1).padStart(2, "0")}-${file.replace(/^\d+-/, "")}.png`) });
}
await browser.close();
console.log(`${FRAMES.length} frames in store/screenshots/framed/`);
