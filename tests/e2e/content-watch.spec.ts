import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// One list of the videos with transliteration, at the top of תכנים and on /watch (2026-11-10).
test("תכנים opens with the same video list as /watch, and the songs", async ({ page }) => {
  await login(page);
  await page.goto("/watch");
  const first = page.getByTestId("watch-list").getByRole("link").first();
  await expect(first).toBeVisible({ timeout: 15000 });
  const href = await first.getAttribute("href");
  await page.goto("/content");
  const list = page.getByTestId("watch-list");
  await expect(list.locator(`a[href="${href}"]`)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: /שירים עם תעתיק/ })).toHaveAttribute("href", "/songs");
  await list.locator(`a[href="${href}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("the tab bar: חזרה, תרגול, פיד, תכנים; the general review opens from the review", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/content", { waitUntil: "domcontentloaded" });
  const bar = page.locator("nav.tabbar");
  for (const name of ["חזרה יומית", "תרגול", "פיד", "תכנים"]) await expect(bar.getByRole("link", { name })).toBeVisible();
  await expect(bar.getByRole("link", { name: "חזרה כללית" })).toHaveCount(0);
  await expect(bar.getByRole("link", { name: "פיד" })).toHaveAttribute("href", "/feed");
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: /חזרה כללית/ })).toHaveAttribute("href", "/browse");
});
