import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Ariel, 25.11: a ת→ע card with a recording showed only a huge speaker, nothing
// to read. The front of an Arabic→Hebrew card is the transliteration, with or
// without a recording; flipping shows the Hebrew.
test("ת→ע card with a recording shows its transliteration, Hebrew on reveal", async ({ page }) => {
  await login(page);

  // Keep only one card that has a recording, due now, so it is the first one shown.
  await page.route("**/api/mobile/deck", async (route) => {
    const res = await route.fetch();
    const deck = await res.json();
    const card = deck.cards.find((c: { clip_path: string | null }) => c.clip_path && deck.audio[c.clip_path]);
    if (!card) return route.fulfill({ response: res });
    card.direction = "ar_to_he";
    card.srs = { ...card.srs, due: new Date(Date.now() - 3600_000).toISOString(), state: 2 };
    await route.fulfill({ response: res, json: { ...deck, cards: [card], reviews: [] } });
  });

  await page.goto("/review");
  const tile = page.locator(".tile.card");
  await expect(tile).toBeVisible({ timeout: 30_000 });

  await expect(tile.locator("button.audio.large")).toHaveCount(0);
  const prompt = tile.locator(".prompt");
  await expect(prompt).toBeVisible();
  expect((await prompt.innerText()).trim().length).toBeGreaterThan(0);

  // The daily tip popup may sit on top of the review
  const tip = page.getByRole("dialog").getByRole("button", { name: "סגור" });
  if (await tip.isVisible()) await tip.click();
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(tile.locator(".answer .answer-main")).toBeVisible();
  await expect(tile.locator(".answer button.audio")).toHaveCount(1);
});

// Ariel, 25.11: flipping a card that has a recording plays it, with no extra tap.
test("revealing a card with a recording plays it automatically", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __plays: number }).__plays = 0;
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      (window as unknown as { __plays: number }).__plays++;
      return orig.call(this).catch(() => {});
    };
  });
  await login(page);

  await page.route("**/api/mobile/deck", async (route) => {
    const res = await route.fetch();
    const deck = await res.json();
    const card = deck.cards.find((c: { clip_path: string | null }) => c.clip_path && deck.audio[c.clip_path]);
    if (!card) return route.fulfill({ response: res });
    card.srs = { ...card.srs, due: new Date(Date.now() - 3600_000).toISOString(), state: 2 };
    await route.fulfill({ response: res, json: { ...deck, cards: [card], reviews: [] } });
  });

  await page.goto("/review");
  await expect(page.locator(".tile.card")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("audio")).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as { __plays: number }).__plays)).toBe(0);

  const tip = page.getByRole("dialog").getByRole("button", { name: "סגור" });
  if (await tip.isVisible()) await tip.click();
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __plays: number }).__plays)).toBe(1);
});
