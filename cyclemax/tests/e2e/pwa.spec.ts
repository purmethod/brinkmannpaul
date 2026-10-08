import { chromium, expect, test } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { API } from "./helpers";

test("PWA ist installierbar (Chrome-Kriterien)", async () => {
  // Installability is never reported in incognito contexts → real (persistent) profile.
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "cm-")), {
    executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium",
    viewport: { width: 393, height: 852 },
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3100/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await page.context().newCDPSession(page);
  const res = (await cdp.send("Page.getInstallabilityErrors")) as { installabilityErrors: { errorId: string }[] };
  expect(res.installabilityErrors).toEqual([]);
  const manifest = await (await page.request.get("http://localhost:3100/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "Cyclemax", display: "standalone", start_url: "/" });
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  await ctx.close();
});

test("Web Push: Service Worker zeigt den Push als Benachrichtigung", async ({ page, context }) => {
  await context.grantPermissions(["notifications"], { origin: "http://localhost:3100" });
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await context.newCDPSession(page);
  const regs: { registrationId: string; scopeURL: string }[] = [];
  cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => regs.push(...e.registrations));
  await cdp.send("ServiceWorker.enable");
  await expect.poll(() => regs.length).toBeGreaterThan(0);
  const reg = regs.find((r) => r.scopeURL.startsWith("http://localhost:3100"))!;
  await cdp.send("ServiceWorker.deliverPushMessage", {
    origin: "http://localhost:3100",
    registrationId: reg.registrationId,
    data: JSON.stringify({ title: "Cyclemax", body: "Halt die Linie. Du bist der Fels.", tag: "cyclemax", url: "/" }),
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const r = await navigator.serviceWorker.ready;
        return (await r.getNotifications()).map((n) => `${n.title}|${n.body}`);
      }),
    )
    .toContain("Cyclemax|Halt die Linie. Du bist der Fels.");
});

test("Backend: Gesundheit und Katalog", async ({ request }) => {
  const health = await (await request.get(`${API}/api/health`)).json();
  expect(health).toMatchObject({ ok: true, claude: true });
  const { lines } = await (await request.get(`${API}/api/lines`)).json();
  expect(lines.length).toBeGreaterThan(60);
});
