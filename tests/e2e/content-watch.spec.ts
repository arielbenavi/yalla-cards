import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("תכנים: תפצ'לו opens /watch in the same window", async ({ page }) => {
  await login(page);
  await page.goto("/content");
  await page.getByText("אוכל").first().click().catch(() => {});
  const btn = page.getByRole("button", { name: /תפצ'לו ע\(א\)לעשא, נגן עם כתוביות לחיצות/ });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(page).toHaveURL(/\/watch$/);
  await expect(page.getByText("סרטונים עם תעתיק")).toBeVisible();
});
