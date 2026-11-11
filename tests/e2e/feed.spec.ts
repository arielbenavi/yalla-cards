import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// The פיד tab: posts show in Arabic only, a post can reveal its transliteration and Hebrew,
// and a tapped word shows its meaning and grows into a phrase. Adds no card.
test("feed: Arabic first, reveal layers, tap a word into a phrase", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 760 });
  await login(page);
  await page.goto("/feed");

  const post = page.getByTestId("feed-post").first();
  await expect(post).toBeVisible({ timeout: 15000 });
  await expect(post.locator(".watch-ar")).toBeVisible();
  await expect(post.locator(".watch-translit")).toHaveCount(0);
  await expect(post.locator(".watch-he")).toHaveCount(0);

  await post.getByRole("button", { name: "תעתיק" }).click();
  await expect(post.locator(".watch-translit")).toBeVisible();
  await post.getByRole("button", { name: "עברית" }).click();
  await expect(post.locator(".watch-he")).not.toBeEmpty();

  await post.locator(".watch-ar .word-tap").first().click();
  await expect(page.getByTestId("word-gloss")).not.toBeEmpty();
  await page.getByRole("button", { name: "+ המילה הבאה" }).click();
  await expect(page.getByTestId("phrase-sheet")).toBeVisible();
  await expect(page.getByTestId("phrase-meaning")).not.toHaveValue("");
  expect(errors).toEqual([]);
});
