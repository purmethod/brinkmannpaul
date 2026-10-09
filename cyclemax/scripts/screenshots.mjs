// Store screenshots from the real app: 6.7" (1290×2796) and 5.5" (1242×2208) iPhone.
// Build first (NEXT_PUBLIC_API_BASE=http://localhost:8787 npm run build), then: npm run screenshots
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const procs = [
  spawn("node", ["tests/e2e/mock-anthropic.mjs", "8788"], { stdio: "ignore", detached: true }),
  spawn(process.execPath, ["--import", "tsx", "server/dev.ts"], {
    stdio: "ignore",
    detached: true,
    env: { ...process.env, PORT: "8787", SQLITE_URL: ":memory:", ANTHROPIC_API_KEY: "x", ANTHROPIC_BASE_URL: "http://127.0.0.1:8788", CLAUDE_FALLBACKS: "off" },
  }),
  spawn("node", ["scripts/serve-static.mjs", "3100"], { stdio: "ignore", detached: true }),
];
// detached → own process group; kill the whole group
const stop = () =>
  procs.forEach((p) => {
    try {
      process.kill(-p.pid, "SIGTERM");
    } catch {}
  });
process.on("exit", stop);

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`timeout ${url}`);
}
await Promise.all([waitFor("http://localhost:8787/api/health"), waitFor("http://localhost:3100/")]);

const SIZES = { "6.7": { width: 430, height: 932 }, "5.5": { width: 414, height: 736 } };
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });

for (const [name, viewport] of Object.entries(SIZES)) {
  const dir = `store/screenshots/${name}`;
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "de-DE", timezoneId: "Europe/Berlin", serviceWorkers: "block" });
  const page = await ctx.newPage();
  const shot = async (file) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${dir}/${file}.png` });
  };
  await page.goto("http://localhost:3100/");
  await page.getByTestId("start-ring").waitFor();
  await shot("01-start");
  await page.getByTestId("start-ring").click();
  await page.getByRole("heading", { name: "Sei der Fels in der Brandung." }).waitFor();
  await shot("02-onboarding");
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Beziehung" }).click();
  // cycle day 24 of 28 → Standfest
  await page.getByTestId("date-wheel").getByRole("option").nth(23).click();
  await page.waitForTimeout(500);
  await shot("03-ihre-tage");
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByTestId("skip-notifications").click();
  await page.getByTestId("phase-word").waitFor();
  await page.getByRole("button", { name: "Hinweis schließen" }).click();
  await shot("04-heute-standfest");
  await page.getByTestId("forecast").click();
  await page.getByRole("heading", { name: "Sie tickt anders." }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("05-verstehen");
  await page.evaluate(() => document.getElementById("red")?.scrollIntoView({ block: "start" }));
  await shot("06-verstehen-standfest");
  await page.goto("http://localhost:3100/chat/");
  await page.getByLabel("Nachricht").fill("Sie ist gereizt und wir streiten. Wie soll ich antworten?");
  await page.getByRole("button", { name: "Senden" }).click();
  await page.getByTestId("answer").waitFor();
  await shot("07-chat");
  await page.goto("http://localhost:3100/profil/");
  await page.getByTestId("profile-input").fill("Ich habe mein Training schleifen lassen und reagiere zu schnell. Sie ist oft gestresst von der Arbeit, Nähe kommt zu kurz. Ich liebe ihre Wärme.");
  await shot("08-profil-erzaehlen");
  await page.getByTestId("profile-submit").click();
  await page.getByTestId("profile").waitFor();
  await shot("09-profil");
  await page.goto("http://localhost:3100/heute/");
  await page.getByTestId("bleeding").click();
  await page.getByTestId("after-entry").waitFor();
  await shot("10-heute-waerme");
  await ctx.close();
}
await browser.close();
stop();
console.log("screenshots in store/screenshots/");
