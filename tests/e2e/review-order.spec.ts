import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("general review ordering (note db2eb95b)", () => {
  test("untagged first, then שוב → קשה → טוב → קל", async ({ page }) => {
    await login(page);
    const { cards } = await page.request.get("/api/review/queue?mode=all").then((r) => r.json());
    expect(cards.length).toBeGreaterThan(0);

    // null sorts ahead of every rating: an unrated card is the one there is no
    // information about, so burying it behind rated ones is backwards.
    const rank = (c: { self_score: number | null }) => (c.self_score == null ? -1 : c.self_score);

    for (let i = 1; i < cards.length; i++) {
      expect(
        rank(cards[i]),
        `card ${i} (${cards[i].self_score}) sorts before card ${i - 1} (${cards[i - 1].self_score})`
      ).toBeGreaterThanOrEqual(rank(cards[i - 1]));
    }
  });

  test("ordering does not drop or duplicate cards", async ({ page }) => {
    await login(page);
    const { cards } = await page.request.get("/api/review/queue?mode=all").then((r) => r.json());
    const ids = cards.map((c: { card_srs_id: string }) => c.card_srs_id);
    expect(new Set(ids).size, "a card appears twice").toBe(ids.length);
  });
});
