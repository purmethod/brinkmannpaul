import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { finishWithoutNotifications, onboard } from "./helpers";

// Accessibility: no serious or critical axe violations on any screen.
async function audit(page: import("@playwright/test").Page, name: string) {
  await page.waitForTimeout(1000); // let fade-in animations finish (opacity affects contrast)
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${name}: ${v.id} – ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test("Barrierefreiheit (axe, WCAG AA) auf allen Screens", async ({ page }) => {
  await page.goto("/");
  await audit(page, "start");
  await page.goto("/onboarding/");
  await audit(page, "onboarding");
  await onboard(page, "relationship", 3);
  await finishWithoutNotifications(page);
  await audit(page, "heute");
  for (const path of ["/verstehen/", "/chat/", "/profil/", "/settings/", "/datenschutz/", "/impressum/", "/admin/"]) {
    await page.goto(path);
    await page.waitForTimeout(300);
    await audit(page, path);
  }
});
