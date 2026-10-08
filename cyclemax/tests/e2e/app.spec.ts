import { expect, test } from "@playwright/test";
import { API, finishWithoutNotifications, onboard } from "./helpers";

test("Onboarding Beziehung → Home mit Ring, Haltung und Tageszeile", async ({ page }) => {
  await onboard(page, "relationship", 2);
  // iPhone in the browser: install instructions before web push
  await expect(page.getByTestId("install-hint")).toContainText("Zum Home-Bildschirm");
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("phase-word")).toHaveText("Kümmern");
  await expect(page.getByTestId("attitude")).toBeVisible();
  await expect(page.getByTestId("daily-line")).not.toBeEmpty();
  await expect(page.getByTestId("bleeding")).toBeVisible();
  await expect(page.getByRole("link", { name: "Chat" })).toBeVisible();
  // no dates, no countdown on home
  await expect(page.locator("main")).not.toContainText(/Tag \d|Periode|\d+\.\s?(Okt|Nov|Jan)/);
});

test("Onboarding Single → nur Tageszeile und Chat", async ({ page }) => {
  await onboard(page, "single");
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("daily-line")).toBeVisible();
  await expect(page.getByTestId("phase-word")).toHaveCount(0);
  await expect(page.getByTestId("bleeding")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chat" })).toBeVisible();
});

test("Blutung eintragen → Gelb, Nachricht, Rückgängig", async ({ page }) => {
  await onboard(page, "relationship", 24);
  await finishWithoutNotifications(page);
  await expect(page.getByTestId("phase-word")).toHaveText("Leiser");
  await page.getByTestId("bleeding").click();
  await expect(page.getByTestId("after-entry")).toHaveText("Sturm vorbei. Jetzt kümmern: Wärme, Ruhe.");
  await expect(page.getByTestId("phase-word")).toHaveText("Kümmern");
  await page.getByRole("button", { name: "Rückgängig" }).click();
  await expect(page.getByTestId("phase-word")).toHaveText("Leiser");
  // other date via the wheel
  await page.getByRole("button", { name: "anderes Datum" }).click();
  await page.getByTestId("date-wheel").getByRole("option").nth(1).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByTestId("phase-word")).toHaveText("Kümmern");
  // persists across reload
  await page.reload();
  await expect(page.getByTestId("phase-word")).toHaveText("Kümmern");
});

test("Chat mit Mock-Claude, Bewertung und Melden", async ({ page, request }) => {
  await onboard(page, "relationship", 23);
  await finishWithoutNotifications(page);
  await page.getByRole("link", { name: "Chat" }).click();
  await expect(page.getByText("Was ist los? Schreib es kurz.")).toBeVisible();
  await page.getByLabel("Nachricht").fill("Sie schreit mich an. Wie soll ich antworten?");
  await page.getByRole("button", { name: "Senden" }).click();
  const answer = page.getByTestId("answer").last();
  await expect(answer).toContainText("Sag: „Ich bin da.");
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
  await expect(page.locator("[data-placeholder]").first()).toHaveText("[NAME]");
  await page.goto("/settings/");
  await expect(page.getByLabel("Tägliche Nachricht")).toHaveValue("06:45");
  await page.getByRole("link", { name: "Zurück" }).click();
  await expect(page.getByTestId("phase-word")).toHaveCount(0);
  // back to relationship keeps her data
  await page.goto("/settings/");
  await page.getByRole("radio", { name: "Beziehung" }).click();
  await page.goto("/");
  await expect(page.getByTestId("phase-word")).toHaveText("Kümmern");
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
  await page.goto("/");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("daily-line")).toBeVisible();
  await page.getByRole("link", { name: "Chat" }).click();
  await page.getByLabel("Nachricht").fill("Erstes Date morgen, was soll ich beachten?");
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByTestId("answer")).toHaveCount(1);
  await expect(page.getByTestId("answer")).not.toContainText("Antwort melden");
  await context.setOffline(false);
});
