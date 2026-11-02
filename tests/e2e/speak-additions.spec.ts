import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Deck, logs and grades are all mocked: this writes nothing to the real database.
const srs = (due: string) => ({ due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2, last_review: null });
const deckCard = (id: string, item_type: string, arabic: string, due: string) => ({
  card_srs_id: `srs-${id}`,
  card_id: `card-${id}`,
  direction: "he_to_ar",
  hebrew_meaning: `פירוש ${id}`,
  translit_nikud: `תעתיק ${id}`,
  arabic_script: arabic,
  item_type,
  notes: null,
  clip_path: null,
  audio_start_sec: null,
  audio_end_sec: null,
  lesson_date: "2026-11-01",
  srs: srs(due),
});

async function mockDeck(page: import("@playwright/test").Page, cards: unknown[], reviews: unknown[]) {
  await page.route("**/api/mobile/deck", (r) => r.fulfill({ json: { generated_at: new Date().toISOString(), cards, reviews, audio: {} } }));
  await page.route("**/api/mobile/sync", (r) => r.fulfill({ json: { ok: true, applied: 0 } }));
  await page.route("**/api/learning-events", (r) => r.fulfill({ json: { ok: true } }));
}

test("the back of a word card shows it in another sentence from the deck", async ({ page }) => {
  await login(page);
  const past = new Date(Date.now() - 3600_000).toISOString();
  const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
  await mockDeck(page, [deckCard("w", "word", "بيت", past), deckCard("s", "sentence", "هادا البيت كبير كتير", future)], []);
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(page.getByTestId("deck-example")).toContainText("תעתיק s");
});

test("the end of the daily review offers a fix round of today's שוב, which logs outside FSRS", async ({ page }) => {
  await login(page);
  const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
  await mockDeck(
    page,
    [deckCard("a", "phrase", "هادا البيت كبير", future)],
    [{ card_srs_id: "srs-a", rating: 1, state: 2, reviewed_at: new Date().toISOString() }]
  );
  await page.addInitScript(() => localStorage.removeItem("fix-round-started"));
  const logged: Record<string, unknown>[] = [];
  await page.route("**/api/focused/queue?**", (r) => {
    expect(r.request().url()).toContain("ids=srs-a");
    return r.fulfill({
      json: {
        cards: [{ card_srs_id: "srs-a", card_id: "card-a", direction: "he_to_ar", hebrew_meaning: "הבית גדול", translit_nikud: "הַאדַא בֵּית כְּבִּיר", arabic_script: null, item_type: "phrase", notes: null, audio_url: null }],
        minutes: 15, planned_items: 1, eligible_total: 1,
      },
    });
  });
  await page.route("**/api/focused/log", (r) => {
    logged.push(r.request().postDataJSON());
    return r.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/today", (r) => {
    if (r.request().method() === "POST") throw new Error("a fix round must not tick the day's focused practice");
    return r.fallback();
  });

  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();
  await page.getByRole("button", { name: "סבב תיקון: 1 כרטיס" }).click();

  await expect(page.getByText("סבב תיקון · נותרו 1")).toBeVisible();
  // The middle rung: a word missing, then only שוב/קשה, so it comes back whole.
  await page.getByRole("button", { name: "מילה חסרה" }).click();
  await expect(page.getByText("_____")).toBeVisible();
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(page.getByRole("button", { name: "קל" })).toHaveCount(0);
  await page.getByRole("button", { name: "קשה" }).click();
  await expect.poll(() => logged[0]).toMatchObject({ source: "fix_round", hint_used: true, outcome: 2 });
  // Second presentation, no rung used: all four grades are back.
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await page.getByRole("button", { name: "קל" }).click();
  await expect(page.getByText("סיימת את סבב התיקון")).toBeVisible();
});
