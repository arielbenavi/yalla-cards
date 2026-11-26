import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { login } from "./helpers";
import { formsGroup, hasOwnPlural, pluralWords } from "../../lib/forms-round";

dotenv.config({ path: ".env.local" });

// Two made-up cards (even first digit: group A), so the round doesn't depend on the deck.
const WORDS = [
  { card_id: "00000000-0000-4000-8000-000000000001", translit_nikud: "יחיד א", arabic_script: null, hebrew_meaning: "פירוש א", plural_form: "רבים א" },
  { card_id: "20000000-0000-4000-8000-000000000002", translit_nikud: "יחיד ב", arabic_script: null, hebrew_meaning: "פירוש ב", plural_form: "רבים ב" },
];

type Logged = { event: string; card_id: string | null; meta: Record<string, unknown> };

/** Events are caught here: a test must never write answers into the A/B data. */
async function catchEvents(page: Page): Promise<Logged[]> {
  const logged: Logged[] = [];
  await page.route("**/api/learning-events", (r) => {
    logged.push(r.request().postDataJSON());
    return r.fulfill({ json: { ok: true } });
  });
  return logged;
}

test("the forms round asks for each plural, logs the answers and ends with a score", async ({ page }) => {
  await login(page);
  const logged = await catchEvents(page);
  await page.route("**/api/forms-round", (r) => r.fulfill({ json: { words: WORDS } }));
  await page.goto("/forms");

  const tile = page.locator(".tile.card");
  await expect(tile).toContainText("יחיד א", { timeout: 30_000 });
  await expect(tile).toContainText("פירוש א");
  await expect(tile).toContainText("רבים?");
  await expect(page.getByTestId("forms-plural")).toHaveCount(0);
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(page.getByTestId("forms-plural")).toHaveText("רבים א");
  await page.getByRole("button", { name: "ידעתי", exact: true }).click();

  // The second word by keyboard: space reveals, 2 = did not know
  await expect(tile).toContainText("יחיד ב");
  await expect(page.getByTestId("forms-plural")).toHaveCount(0);
  await page.keyboard.press("2");
  await expect(tile, "2 before the reveal does nothing").toContainText("רבים?");
  await page.keyboard.press(" ");
  await expect(page.getByTestId("forms-plural")).toHaveText("רבים ב");
  await page.keyboard.press("2");

  await expect(page.getByRole("heading", { name: "סיימת ✓" })).toBeVisible();
  await expect(page.getByTestId("forms-score")).toHaveText("1 מתוך 2 נכון");
  await expect(page.getByRole("button", { name: "חזרה לחזרה היומית" })).toBeVisible();

  await expect.poll(() => logged.length).toBe(3);
  expect(logged[0]).toEqual({ event: "forms_round_started", card_id: null, meta: { size: 2 } });
  expect(logged[1]).toEqual({ event: "forms_answer", card_id: WORDS[0].card_id, meta: { form: "plural", correct: true, group: "A" } });
  expect(logged[2]).toEqual({ event: "forms_answer", card_id: WORDS[1].card_id, meta: { form: "plural", correct: false, group: "A" } });
});

test("the daily review's done screen offers the round once a day", async ({ page }) => {
  await login(page);
  const logged = await catchEvents(page);
  // One made-up card that isn't due gives the done screen
  const due = new Date(Date.now() + 5 * 86_400_000).toISOString();
  const card = {
    card_srs_id: "srs-x", card_id: "card-x", direction: "he_to_ar", hebrew_meaning: "פירוש", translit_nikud: "תעתיק",
    arabic_script: null, item_type: "word", notes: null, clip_path: null, audio_start_sec: null, audio_end_sec: null, lesson_date: "2026-11-01",
    srs: { due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 2, lapses: 0, state: 2, last_review: null },
  };
  await page.route("**/api/mobile/deck", (r) =>
    r.fulfill({ json: { generated_at: new Date().toISOString(), cards: [card], reviews: [], audio: {} } })
  );
  await page.route("**/api/mobile/sync", (r) => r.fulfill({ json: { ok: true, applied: 0 } }));
  await page.route("**/api/forms-round", (r) => r.fulfill({ json: { words: WORDS } }));

  await page.goto("/review");
  const offer = page.getByRole("button", { name: "סבב צורות (בטא): 10 מילים" });
  await expect(offer).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => logged.filter((e) => e.event === "forms_round_offered").length).toBeGreaterThan(0);
  const tip = page.getByRole("button", { name: "הבנתי" });
  if (await tip.isVisible().catch(() => false)) await tip.click();
  await offer.click();
  await page.waitForURL(/\/forms$/);
  await expect(page.locator(".tile.card")).toContainText("יחיד א", { timeout: 30_000 });

  await page.goto("/review");
  await expect(page.getByRole("button", { name: /חזרה להיום/ })).toBeVisible({ timeout: 30_000 });
  await expect(offer).toHaveCount(0);
});

test("the A/B split is stable, halves the real eligible words, and the API serves only A", async ({ page }) => {
  expect(formsGroup(WORDS[0].card_id)).toBe("A");
  expect(formsGroup("10000000-0000-4000-8000-000000000000")).toBe("B");
  expect(formsGroup("f0000000-0000-4000-8000-000000000000")).toBe("B");
  expect(hasOwnPlural("בֵּית", "בית")).toBe(false);
  expect(hasOwnPlural("בֵּית", "—")).toBe(false);
  expect(hasOwnPlural("בֵּית", "בְּיוּת")).toBe(true);

  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    realtime: { transport: class {} as never },
  });
  const eligible = await pluralWords(sb, [2]);
  const a = eligible.filter((w) => formsGroup(w.card_id) === "A").length;
  console.log(`eligible ${eligible.length}: A ${a}, B ${eligible.length - a}`);
  expect(a / eligible.length).toBeGreaterThan(0.35);
  expect(a / eligible.length).toBeLessThan(0.65);

  await login(page);
  const res = await page.request.get("/api/forms-round");
  expect(res.ok()).toBe(true);
  const { words } = (await res.json()) as { words: typeof WORDS };
  expect(words).toHaveLength(Math.min(10, a));
  const ids = new Set(eligible.map((w) => w.card_id));
  for (const w of words) {
    expect(formsGroup(w.card_id)).toBe("A");
    expect(ids.has(w.card_id)).toBe(true);
  }
});
