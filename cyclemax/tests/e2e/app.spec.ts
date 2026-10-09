import { expect, test } from "@playwright/test";

// Surface browser errors in the CI log.
test.beforeEach(({ page }) => {
  page.on("console", (m) => m.type() === "error" && console.log(`[browser:${test.info().title}]`, m.text()));
  page.on("pageerror", (e) => console.log(`[pageerror:${test.info().title}]`, e.message, e.stack));
});
import { API, fakeSpeech, finishWithoutNotifications, onboard } from "./helpers";

test("Onboarding Beziehung → Home mit Ring, Haltung und Tageszeile", async ({ page }) => {
  await onboard(page, "relationship", 2);
  // iPhone in the browser: install instructions before web push
  await expect(page.getByTestId("install-hint")).toContainText("Zum Home-Bildschirm");
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("phase-word")).toHaveText("Wärme");
  await expect(page.getByTestId("attitude")).toBeVisible();
  await expect(page.getByTestId("forecast")).toContainText("Was kommen kann: Krämpfe, Kopfweh, wenig Energie");
  await expect(page.getByTestId("daily-line")).not.toBeEmpty();
  await expect(page.getByTestId("bleeding")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cyclemax fragen" })).toBeVisible();
  // skipped notifications → one quiet, dismissible hint
  await expect(page.getByTestId("notif-hint")).toContainText("Vorwarnungen sind aus.");
  await page.getByRole("button", { name: "Hinweis schließen" }).click();
  await expect(page.getByTestId("notif-hint")).toHaveCount(0);
  // no dates, no countdown on home
  await expect(page.locator("main")).not.toContainText(/Tag \d|Periode|\d+\.\s?(Okt|Nov|Jan)/);
});

test("Onboarding Single → nur Tageszeile und Chat", async ({ page }) => {
  await onboard(page, "single");
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("daily-line")).toBeVisible();
  await expect(page.getByTestId("phase-word")).toHaveCount(0);
  await expect(page.getByTestId("bleeding")).toHaveCount(0);
  await page.getByRole("link", { name: "Cyclemax fragen" }).click();
  // one-tap question for a man with a full head
  await page.getByRole("button", { name: "Erstes Date morgen. Worauf kommt es an?" }).click();
  await expect(page.getByTestId("answer")).toHaveCount(1);
});

test("Ihre Tage eintragen → Gelb, Nachricht, Rückgängig", async ({ page }) => {
  await onboard(page, "relationship", 24);
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("phase-word")).toHaveText("Standfest");
  await page.getByTestId("bleeding").click();
  await expect(page.getByTestId("after-entry")).toHaveText("Eingetragen. Sturm vorbei – den Rest übernimmt Cyclemax.");
  await expect(page.getByTestId("phase-word")).toHaveText("Wärme");
  await page.getByRole("button", { name: "Rückgängig" }).click();
  await expect(page.getByTestId("phase-word")).toHaveText("Standfest");
  // other date via the wheel
  await page.getByRole("button", { name: "anderes Datum" }).click();
  await page.getByTestId("date-wheel").getByRole("option").nth(1).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByTestId("phase-word")).toHaveText("Wärme");
  // persists across reload
  await page.reload();
  await expect(page.getByTestId("phase-word")).toHaveText("Wärme");
});

test("Chat mit Mock-Claude, Bewertung und Melden", async ({ page, request }) => {
  await onboard(page, "relationship", 23);
  await finishWithoutNotifications(page);
  await page.getByRole("link", { name: "Cyclemax fragen" }).click();
  await expect(page.getByText("Was ist los? Sprich oder schreib.")).toBeVisible();
  await page.getByLabel("Nachricht").fill("Sie schreit mich an. Wie soll ich antworten?");
  await page.getByRole("button", { name: "Senden" }).click();
  const answer = page.getByTestId("answer").last();
  await expect(answer.getByTestId("say")).toContainText("„Ich bin da. Wir reden morgen in Ruhe.“");
  await answer.getByRole("button", { name: "Daumen hoch" }).click();
  await expect(answer.getByRole("button", { name: "Daumen hoch" })).toHaveAttribute("aria-pressed", "true");
  page.once("dialog", (d) => d.accept());
  await answer.getByRole("button", { name: "Antwort melden" }).click();
  await expect(answer).toContainText("Gemeldet. Danke.");
  const ov = await (await request.get(`${API}/api/admin/overview`, { headers: { authorization: "Bearer e2e-admin" } })).json();
  expect(ov.reports.some((r: { text: string; topic: string }) => r.text.includes("Ich bin da") && r.topic === "Streit")).toBe(true);
  // chat history stays on the device
  await page.reload();
  await expect(page.getByTestId("answer")).toHaveCount(1);
});

test("Settings: Modus, Uhrzeit, neutrale Benachrichtigungen, Links", async ({ page }) => {
  await onboard(page, "relationship", 3);
  await finishWithoutNotifications(page);
  await page.getByRole("link", { name: "Einstellungen" }).click();
  await page.getByRole("radio", { name: "Single" }).click();
  await page.getByLabel("Tägliche Nachricht").fill("06:45");
  await page.getByRole("switch", { name: "Neutrale Benachrichtigungen" }).click();
  await expect(page.getByRole("switch", { name: "Neutrale Benachrichtigungen" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("link", { name: "PURE Method" })).toHaveAttribute("href", "https://purmethod.com");
  await page.getByRole("link", { name: "Datenschutz" }).click();
  await expect(page.getByRole("heading", { name: "Was an unseren Server geht" })).toBeVisible();
  await page.getByRole("link", { name: "Zurück" }).click();
  await page.getByRole("link", { name: "Impressum" }).click();
  await expect(page.locator("main")).toContainText("Paul Brinkmann");
  await expect(page.locator("[data-placeholder]")).toHaveText(["[ADRESSE]"]);
  await page.goto("/settings/");
  await expect(page.getByLabel("Tägliche Nachricht")).toHaveValue("06:45");
  await page.getByRole("link", { name: "Zurück" }).click();
  await expect(page.getByTestId("phase-word")).toHaveCount(0);
  // back to relationship keeps her data
  await page.goto("/settings/");
  await page.getByRole("radio", { name: "Beziehung" }).click();
  await page.goto("/heute/");
  await expect(page.getByTestId("phase-word")).toHaveText("Wärme");
});

test("Alle Daten löschen: lokal und auf dem Server", async ({ page, request }) => {
  await onboard(page, "relationship", 3);
  await finishWithoutNotifications(page);
  await page.getByRole("button", { name: "Daumen hoch" }).click();
  const deviceId = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open("cyclemax");
        open.onsuccess = () => {
          const get = open.result.transaction("kv").objectStore("kv").get("state");
          get.onsuccess = () => resolve(get.result.deviceId);
        };
      }),
  );
  const votes = async () => {
    const ov = await (await request.get(`${API}/api/admin/overview`, { headers: { authorization: "Bearer e2e-admin" } })).json();
    return ov.lines.reduce((n: number, l: { up: number }) => n + l.up, 0);
  };
  await expect.poll(votes).toBeGreaterThan(0);
  await page.goto("/settings/");
  await page.getByTestId("delete-all").click();
  await page.getByTestId("confirm-delete").click();
  await expect(page).toHaveURL(/\/onboarding\/$/);
  await expect.poll(votes).toBe(0);
  const newId = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open("cyclemax");
        open.onsuccess = () => {
          const get = open.result.transaction("kv").objectStore("kv").get("state");
          get.onsuccess = () => resolve(get.result.deviceId);
        };
      }),
  );
  expect(newId).not.toBe(deviceId);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sei der Fels in der Brandung." })).toBeVisible();
});

test("Offline-Start und Offline-Chat aus der Wissensbasis", async ({ page, context }) => {
  await onboard(page, "single");
  await finishWithoutNotifications(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // warm the other pages
  await page.goto("/chat/");
  await page.goto("/heute/");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("daily-line")).toBeVisible();
  await page.getByRole("link", { name: "Cyclemax fragen" }).click();
  await page.getByLabel("Nachricht").fill("Erstes Date morgen, was soll ich beachten?");
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByTestId("answer")).toHaveCount(1);
  await expect(page.getByTestId("answer")).not.toContainText("Antwort melden");
  await context.setOffline(false);
});

test("Startseite: nur der Ring und CYCLEMAX", async ({ page }) => {
  await page.goto("/");
  const start = page.getByTestId("start-ring");
  await expect(start).toBeVisible();
  await expect(page.locator("main")).toHaveText(/^\s*Cyclemax\s*$/i);
  await expect(page.locator("main button")).toHaveCount(1);
});

test("Vorschau: einen Tag vor Standfest kommt der Hinweis", async ({ page }) => {
  await onboard(page, "relationship", 20);
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("heads-up")).toHaveText("Hey Man, morgen beginnt Standfest. Sie kann dünnhäutiger werden – du bleibst ruhig.");
  // back on the start screen the ring shows the phase colour
  await page.getByRole("link", { name: "Start" }).click();
  await expect(page.getByTestId("start-ring")).toBeVisible();
});

test("Profil per Sprache: Erzähl mir von euch → Profil → Kontext im Chat", async ({ page }) => {
  await fakeSpeech(page, "Sie ist oft gestresst, wir streiten über den Haushalt und Nähe kommt zu kurz.");
  await onboard(page, "relationship", 5);
  await finishWithoutNotifications(page);
  await page.getByTestId("profile-link").click();
  await expect(page.getByRole("heading", { name: "Erzähl mir von euch." })).toBeVisible();
  await page.getByRole("button", { name: "Frei sprechen" }).click();
  await expect(page.getByTestId("profile-input")).toHaveValue("Sie ist oft gestresst, wir streiten über den Haushalt und Nähe kommt zu kurz.");
  await page.getByRole("button", { name: "Aufnahme beenden" }).click();
  await page.getByTestId("profile-submit").click();
  await expect(page.getByTestId("profile")).toContainText("Lebe, als würdest du allein leben");
  await expect(page.getByTestId("balance")).toContainText("Du ziehst dich eher zurück");
  await expect(page.getByTestId("profile")).toContainText("Jeden Morgen trainieren, egal wie die Stimmung ist.");
  // persists, and the home menu now links to the profile
  await page.goto("/heute/");
  await expect(page.getByTestId("profile-link")).toContainText("Dein Profil");
  // the profile turns into one small step per day on the home screen
  await expect(page.getByTestId("next-step")).toContainText("Jeden Morgen trainieren, egal wie die Stimmung ist.");
  await page.getByRole("button", { name: "Erledigt" }).click();
  await expect(page.getByTestId("next-step")).toContainText("Deinen Raum so halten, wie du ihn für dich willst.");
  // chat: mic dictation into the input
  await page.goto("/chat/?voice=1");
  await expect(page.getByLabel("Nachricht")).toHaveValue("Sie ist oft gestresst, wir streiten über den Haushalt und Nähe kommt zu kurz.");
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByTestId("answer")).toHaveCount(1);
});

test("Verstehen: sie tickt anders – Vorschau der Phasen mit Datum, Du führst", async ({ page }) => {
  await onboard(page, "relationship", 23);
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("phase-word")).toHaveText("Standfest");
  await expect(page.getByTestId("forecast")).toContainText("Dünnhäutiger, schneller gereizt");
  await page.getByTestId("forecast").click();
  await expect(page).toHaveURL(/\/verstehen\/#red$/);
  await expect(page.getByRole("heading", { name: "Sie tickt anders." })).toBeVisible();
  await expect(page.getByText(/Testosteron ist morgens am höchsten/)).toBeVisible();
  const outlook = page.getByTestId("outlook");
  await expect(outlook.getByRole("link")).toHaveCount(4);
  await expect(outlook.getByRole("link").first()).toContainText("Standfest");
  await expect(outlook.getByRole("link").first()).toContainText("jetzt");
  await expect(outlook.getByRole("link").nth(1)).toContainText("Wärme");
  await expect(page.getByTestId("phase-red")).toContainText("jetzt");
  await expect(page.getByTestId("phase-red")).toContainText("Du führst: mit Ruhe");
  await expect(page.getByText("Marc Aurel, Selbstbetrachtungen 4,49")).toBeVisible();
  // the ring on home leads here too
  await page.goto("/heute/");
  await page.getByRole("link", { name: "Standfest – Phase verstehen" }).click();
  await expect(page).toHaveURL(/\/verstehen\/$/);
});
