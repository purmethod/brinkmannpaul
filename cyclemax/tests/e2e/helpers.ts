import { expect, type Page } from "@playwright/test";

export const API = "http://localhost:8787";

/** Runs the onboarding. `daysAgo` = first day of her last bleeding (relationship only). */
export async function onboard(page: Page, mode: "relationship" | "single", daysAgo = 2) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding\/$/);
  await expect(page.getByRole("heading", { name: "Sei der Fels in der Brandung." })).toBeVisible();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: mode === "relationship" ? "Beziehung" : "Single" }).click();
  if (mode === "relationship") {
    const wheel = page.getByTestId("date-wheel");
    await wheel.getByRole("option").nth(daysAgo).click();
    await expect(wheel.getByRole("option").nth(daysAgo)).toHaveAttribute("aria-selected", "true");
    await page.waitForTimeout(400);
    await expect(wheel.getByRole("option").nth(daysAgo)).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Weiter" }).click();
  }
  await expect(page.getByRole("heading", { name: "Jeden Tag eine Zeile." })).toBeVisible();
}

export async function finishWithoutNotifications(page: Page) {
  await page.getByTestId("skip-notifications").click();
  await expect(page).toHaveURL(/localhost:3100\/$/);
}
