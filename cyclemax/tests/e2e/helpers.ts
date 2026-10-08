import { expect, type Page } from "@playwright/test";

export const API = "http://localhost:8787";

/** Start screen → onboarding. `daysAgo` = first day of her last bleeding (relationship only). */
export async function onboard(page: Page, mode: "relationship" | "single", daysAgo = 2) {
  await page.goto("/");
  await page.getByTestId("start-ring").click();
  await expect(page).toHaveURL(/\/onboarding\/$/);
  await expect(page.getByRole("heading", { name: "Sei der Fels in der Brandung." })).toBeVisible();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: mode === "relationship" ? "Beziehung" : "Single" }).click();
  if (mode === "relationship") {
    const wheel = page.getByTestId("date-wheel");
    await wheel.getByRole("option").nth(daysAgo).click();
    await page.waitForTimeout(400);
    await expect(wheel.getByRole("option").nth(daysAgo)).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Weiter" }).click();
  }
  await expect(page.getByRole("heading", { name: mode === "single" ? "Jeden Tag eine Zeile." : "Ich sag dir rechtzeitig Bescheid." })).toBeVisible();
}

export async function finishWithoutNotifications(page: Page) {
  await page.getByTestId("skip-notifications").click();
  await expect(page).toHaveURL(/\/heute\/$/);
}

/** Fake Web Speech API: every start() "hears" the given sentence. */
export async function fakeSpeech(page: Page, sentence: string) {
  await page.addInitScript((s) => {
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => this.onresult?.({ results: [{ isFinal: false, 0: { transcript: s.slice(0, 12) } }] }), 50);
        setTimeout(() => this.onresult?.({ results: [{ isFinal: true, 0: { transcript: s } }] }), 150);
      }
      stop() {
        setTimeout(() => this.onend?.(), 10);
      }
    }
    const w = window as unknown as { webkitSpeechRecognition: unknown; SpeechRecognition: unknown };
    w.SpeechRecognition = FakeRecognition;
    w.webkitSpeechRecognition = FakeRecognition;
  }, sentence);
}
