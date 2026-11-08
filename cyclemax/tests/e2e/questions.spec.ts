import { expect, test } from "@playwright/test";

test.describe("survey in six languages", () => {
  test("language boxes at the top switch every text; Arabic runs right to left", async ({ page }) => {
    await page.goto("/questions/?lang=ar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ساهمي في بناء تطبيق دورتكِ.");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("languages").getByRole("radio")).toHaveCount(6);
    await expect(page.getByTestId("instagram")).toContainText("@buildpaul");

    await page.getByRole("radio", { name: "English" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Help build your cycle app.");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page).toHaveURL(/lang=en/);
    await expect(page.getByTestId("one_tap-4")).toHaveText("essential");

    await page.getByRole("radio", { name: "Русский" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Сделаем твоё приложение для цикла вместе.");
  });

  test("an answer in Spanish is sent with its language", async ({ page }) => {
    let sent: Record<string, unknown> | null = null;
    await page.route("**/api/survey", async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto("/questions/?lang=es");
    await page.getByTestId("one_tap-3").click();
    await page.getByRole("button", { name: "demasiado complicada" }).click();
    await page.getByTestId("survey-consent").check();
    await page.getByTestId("survey-send").click();
    await expect(page.getByRole("heading", { name: "¡Muchas gracias!" })).toBeVisible();
    await expect(page.getByTestId("instagram")).toHaveAttribute("href", "https://www.instagram.com/buildpaul/");
    expect(sent).toMatchObject({ lang: "es", ratings: { one_tap: 3 }, annoyances: ["zu kompliziert"] });
  });
});
