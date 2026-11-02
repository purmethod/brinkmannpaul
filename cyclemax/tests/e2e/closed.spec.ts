import { expect, test } from "@playwright/test";

// Before launch: a visitor from the survey or upload link never gets into the app.
test.describe("closed before launch", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("app pages lead to coming soon", async ({ page }) => {
    for (const path of ["/heute/", "/onboarding/", "/settings/", "/chat/", "/verstehen/", "/profil/"]) {
      await page.goto(path);
      await expect(page).toHaveURL("http://localhost:3100/");
      await expect(page.getByText("coming soon")).toBeVisible();
    }
  });

  test("survey: privacy opens in a new tab and its back arrow does not open the app", async ({ page, context }) => {
    await page.goto("/questions/");
    await expect(page.getByRole("heading", { name: "Bau deine Zyklus-App mit." })).toBeVisible();
    const [privacy] = await Promise.all([context.waitForEvent("page"), page.getByRole("link", { name: "Datenschutzerklärung" }).click()]);
    await privacy.waitForLoadState();
    await expect(privacy).toHaveURL(/\/datenschutz\//);
    await privacy.getByRole("button", { name: "Zurück" }).click();
    await expect(privacy).toHaveURL("http://localhost:3100/");
    await expect(privacy.getByText("coming soon")).toBeVisible();
  });

  test("the owner opens the app with the preview link", async ({ page }) => {
    await page.goto("/onboarding/?vorschau=fels");
    await expect(page.getByRole("heading", { name: "Sei der Fels in der Brandung." })).toBeVisible();
    await page.goto("/heute/");
    await expect(page).not.toHaveURL("http://localhost:3100/");
  });
});
