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

test("the back of a card shows its plural", async ({ page }) => {
  await login(page);
  const past = new Date(Date.now() - 3600_000).toISOString();
  await mockDeck(page, [{ ...deckCard("w", "word", "قميص", past), plural_form: "קֻמְצַאן" }], []);
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();
  await expect(page.getByTestId("card-plural")).toHaveCount(0);
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(page.getByTestId("card-plural")).toHaveText("רבים: קֻמְצַאן");
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

test("a word tapped in a sentence shows its card, and an unknown one goes to the translation list", async ({ page }) => {
  await login(page);
  const past = new Date(Date.now() - 3600_000).toISOString();
  const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
  const sentence = { ...deckCard("s", "sentence", "شفت البيت الجديد", past), translit_nikud: "שֻפְת (א)לְבֵּית זְ'בַּרְגַ'ד," };
  const known = { ...deckCard("k", "word", "بيت", future), translit_nikud: "בֵּית", hebrew_meaning: "בית" };
  await mockDeck(page, [sentence, known], []);
  await page.addInitScript(() => localStorage.removeItem("word-requests.json"));
  const sent: { items: { word: string; arabic: string; sentence: string }[] }[] = [];
  await page.route("**/api/mobile/word-requests", (r) => {
    sent.push(r.request().postDataJSON());
    return r.fulfill({ json: { added: 1, duplicates: 0 } });
  });
  let grades = 0;
  await page.route("**/api/mobile/sync", (r) => {
    grades += r.request().postDataJSON().reviews.length;
    return r.fulfill({ json: { ok: true, applied: 0 } });
  });

  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();

  await expect(page.getByRole("button", { name: "שֻפְת" })).toHaveCount(0);
  await page.getByRole("button", { name: "הצג תשובה" }).click();

  await page.getByRole("button", { name: "(א)לְבֵּית" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("אולי המילה הזאת");
  await expect(sheet).toContainText("בֵּית = בית");
  await page.keyboard.press("1");
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);

  await page.getByRole("button", { name: "זְ'בַּרְגַ'ד", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("אין כרטיס למילה הזאת");
  await page.getByRole("button", { name: "הוסף לרשימת תרגום" }).click();
  await expect(page.getByRole("button", { name: "נוסף לרשימה ✓" })).toBeVisible();
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0].items[0]).toMatchObject({ word: "זְ'בַּרְגַ'ד", arabic: "الجديد", sentence: sentence.translit_nikud });
  expect(grades, "a key pressed with the sheet open must not grade").toBe(0);
});

test("← shows the card just graded, to read only, and skipped cards can still be graded", async ({ page }) => {
  await login(page);
  const at = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
  const [a, b, c] = [deckCard("a", "word", "بيت", at(3)), deckCard("b", "word", "باب", at(2)), deckCard("c", "word", "شباك", at(1))];
  await mockDeck(page, [a, b, c], []);
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();

  const prompt = page.locator(".tile.card .prompt");
  const previous = page.getByRole("button", { name: "הקודם", exact: true });
  await expect(prompt).toHaveText("פירוש a");
  await expect(previous).toHaveCount(0);

  // As the server would answer the sync that follows a grade: the card is no longer due
  await mockDeck(page, [b, c], []);
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await page.getByRole("button", { name: "טוב", exact: true }).click();
  await expect(prompt).toHaveText("פירוש b");

  // The way back is there on the answer side too
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(page.getByRole("button", { name: "לכרטיס הקודם" })).toBeVisible();
  await page.getByRole("button", { name: "לכרטיס הקודם" }).click();
  await expect(prompt).toHaveText("פירוש a");
  await page.getByRole("button", { name: "חזרה לתור" }).click();

  // Back to the graded card: its answer is open and it cannot be graded twice
  await previous.click();
  await expect(prompt).toHaveText("פירוש a");
  await expect(page.locator(".answer-main")).toContainText("תעתיק a");
  await expect(page.getByTestId("peek-rating")).toHaveText("דירגת: טוב");
  await expect(page.locator(".grades")).toHaveCount(0);

  await page.getByRole("button", { name: "חזרה לתור" }).click();
  await expect(prompt).toHaveText("פירוש b");

  // A skipped card goes back to being a live card
  // dispatchEvent: in dev, Next's indicator sits over this corner and takes real clicks
  await page.getByRole("button", { name: "דלג" }).dispatchEvent("click");
  await expect(prompt).toHaveText("פירוש c");
  await previous.click();
  await expect(prompt).toHaveText("פירוש b");
  await expect(page.getByTestId("peek-rating")).toHaveCount(0);
  await page.getByRole("button", { name: "הצג תשובה" }).click();
  await expect(page.locator(".grades")).toBeVisible();
});

test("a long card scrolls inside its tile, with the grades above the tabs and the page still", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const past = new Date(Date.now() - 3600_000).toISOString();
  const long = "מילה ארוכה בתוך משפט ארוך מאוד ".repeat(14).trim();
  await mockDeck(page, [{ ...deckCard("l", "sentence", "بيت", past), hebrew_meaning: long, translit_nikud: long }], []);
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();
  await page.getByRole("button", { name: "הצג תשובה" }).click();

  const grades = await page.locator(".grades").boundingBox();
  const tabs = await page.locator("nav.tabbar").boundingBox();
  expect(grades!.y + grades!.height).toBeLessThanOrEqual(tabs!.y);
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= window.innerHeight)).toBe(true);

  // The top of the card can be reached
  const card = page.locator(".tile.card");
  expect(await card.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await card.evaluate((el) => (el.scrollTop = 0));
  const top = await card.boundingBox();
  const prompt = await page.locator(".tile.card .prompt").boundingBox();
  expect(prompt!.y).toBeGreaterThanOrEqual(top!.y);
  await page.screenshot({ path: process.env.SHOT ?? "test-results/long-card.png" });
});

test("/watch: a tapped word pauses the video, shows its meaning and is saved to the list", async ({ page }) => {
  await login(page);
  await page.route("**/api/mobile/deck", (r) => r.fulfill({ json: { generated_at: new Date().toISOString(), cards: [], reviews: [], audio: {} } }));
  await page.route("**/api/mobile/sync", (r) => r.fulfill({ json: { ok: true, applied: 0 } }));
  await page.addInitScript(() => localStorage.removeItem("word-requests.json"));
  const sent: { items: { word: string; card_id: string }[] }[] = [];
  await page.route("**/api/mobile/word-requests", (r) => {
    sent.push(r.request().postDataJSON());
    return r.fulfill({ json: { added: 1, duplicates: 0 } });
  });
  await page.route("**/api/media/test-item", (r) =>
    r.fulfill({
      json: {
        item: { title: "סיפור", source_url: null, glosses: { "חאכמ": "שליט" } },
        media_url: null,
        segments: [{ id: "seg-1", idx: 0, start_sec: 0, end_sec: 5, ar: "عن حاكم", translit: "עַן חַאכֶּם,", he: "על שליט", verified: true }],
      },
    })
  );
  await page.goto("/watch/test-item", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("saved-count")).toContainText("0");
  await expect(page.getByText("על שליט")).toHaveCount(0);
  await page.getByRole("button", { name: "עברית" }).click();
  await expect(page.getByText("על שליט").first()).toBeVisible();

  await page.getByRole("button", { name: "חַאכֶּם" }).first().click();
  await expect(page.getByTestId("word-gloss")).toHaveText("שליט");
  await page.getByRole("button", { name: "הוסף לרשימת תרגום" }).click();
  await expect(page.getByTestId("saved-count")).toContainText("1");
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0].items[0]).toMatchObject({ word: "חַאכֶּם", card_id: "watch:test-item" });
});

test("/watch: an unchecked line says so, and the admin's edit saves and marks it checked", async ({ page }) => {
  await login(page);
  await page.route("**/api/mobile/deck", (r) => r.fulfill({ json: { generated_at: new Date().toISOString(), cards: [], reviews: [], audio: {} } }));
  await page.route("**/api/mobile/sync", (r) => r.fulfill({ json: { ok: true, applied: 0 } }));
  const segment = { id: "seg-1", idx: 0, start_sec: 0, end_sec: 5, ar: "عن حاكم", translit: "עַן חַאכֶּם", he: "על שליט", verified: false };
  await page.route("**/api/media/test-item", (r) =>
    r.fulfill({ json: { item: { title: "סיפור", source_url: null, glosses: {} }, media_url: null, segments: [segment] } })
  );
  const saved: Record<string, unknown>[] = [];
  await page.route("**/api/media/segments/seg-1", (r) => {
    const body = r.request().postDataJSON();
    saved.push(body);
    return r.fulfill({ json: { segment: { ...segment, ...body } } });
  });
  await page.goto("/watch/test-item", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("unchecked")).toBeVisible();
  await page.getByRole("button", { name: "ערוך שורה" }).click();
  await page.getByLabel("עברית").last().fill("על השליט");
  await page.getByRole("button", { name: "שמור ואשר" }).click();
  await expect.poll(() => saved.length).toBe(1);
  expect(saved[0]).toMatchObject({ he: "על השליט", verified: true });
  await expect(page.getByTestId("unchecked")).toHaveCount(0);
});

test("a card with a clip keeps its question centred in the card", async ({ page }) => {
  await login(page);
  const past = new Date(Date.now() - 3600_000).toISOString();
  const card = { ...deckCard("c", "word", "دقيقة", past), hebrew_meaning: "דקה (זמן)", clip_path: "clips/c.mp3" };
  await page.route("**/api/mobile/deck", (r) => r.fulfill({ json: { generated_at: new Date().toISOString(), cards: [card], reviews: [], audio: { "clips/c.mp3": "/nothing.mp3" } } }));
  await page.route("**/api/mobile/sync", (r) => r.fulfill({ json: { ok: true, applied: 0 } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  const tip = page.getByRole("button", { name: "הבנתי" });
  await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await tip.isVisible().catch(() => false)) await tip.click();
  const prompt = page.getByText("דקה (זמן)");
  await prompt.waitFor();
  await expect(page.locator("audio")).toHaveCount(1);
  const [p, c] = await Promise.all([prompt.boundingBox(), page.locator(".tile.card").boundingBox()]);
  expect(Math.abs(p!.y + p!.height / 2 - (c!.y + c!.height / 2))).toBeLessThan(6);
});

test("the practice tab shows a red dot when practice has waited, and /practice leads to it", async ({ page }) => {
  await login(page);
  await page.route("**/api/practice-status", (r) =>
    r.fulfill({
      json: {
        current_meeting: 7,
        stale: true,
        next: { label: "הטיות ממפגש 7", href: "/inflection-drill?meeting=7" },
        items: [
          { task: "inflections", label: "הטיות ממפגש 7", href: "/inflection-drill?meeting=7", days_since: null, stale: true },
          { task: "conversation", label: "סיטואציה לתרגול", href: "/simulate?tab=dialogue", days_since: 0, stale: false },
        ],
      },
    })
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("practice-dot")).toBeVisible();
  await expect(page.getByTestId("practice-status")).toContainText("עוד לא תרגלת");
  await expect(page.getByTestId("practice-status")).toContainText("תרגלת היום");
});

test("the end of the daily review offers what has waited longest", async ({ page }) => {
  await login(page);
  await mockDeck(page, [], []);
  await page.addInitScript(() => localStorage.setItem("fix-round-started", new Date().toLocaleDateString("en-CA")));
  await page.route("**/api/practice-status", (r) =>
    r.fulfill({ json: { current_meeting: 7, stale: true, items: [], next: { label: "הטיות ממפגש 7", href: "/inflection-drill?meeting=7" } } })
  );
  await page.goto("/review", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("next-practice")).toHaveText("עכשיו: הטיות ממפגש 7");
});

test("drills and translations start from the current meeting, and ?meeting= goes straight in", async ({ page }) => {
  await login(page);
  const drills = await page.request.get("/api/inflection-drill").then((r) => r.json());
  const current = drills.current_meeting;
  expect(current).toBeGreaterThan(0);
  await page.goto("/inflection-drill", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".grid button").first()).toContainText(`מפגש ${current}`);
  await expect(page.locator(".grid button").first()).toContainText("המפגש הנוכחי");

  const negation = drills.sets.filter((s: { id: string; group: string }) => s.group === "מפגש 7" && s.id.includes(":kasar"));
  expect(negation.length).toBe(1);
  expect(negation[0].slots.length).toBe(12);

  await page.goto(`/inflection-drill?meeting=${current}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "חזרה לרשימה" })).toBeVisible();

  await page.goto("/translate", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h2").first()).toHaveText(`מפגש ${current}`);
});

test("the menu: practice lives under one tab, admin screens under another, מפגשים is gone", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice", { waitUntil: "domcontentloaded" });
  for (const name of ["התאמת הטיות", "סיומות שייכות", "תרגום משפטים", "שיחה", "אימון ממוקד", "משחק תמונות", "מספרים", "אותיות"]) {
    await expect(page.locator("main").getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
  }
  // dispatchEvent: on the phone viewport the dev server's own badge sits over this corner.
  // Retried because a click before hydration does nothing.
  const sheet = page.getByRole("dialog", { name: "עוד" });
  await expect(async () => {
    await page.getByRole("button", { name: "עוד" }).dispatchEvent("click");
    await expect(sheet.getByRole("link", { name: "אדמין" })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(sheet.getByRole("link", { name: "מפגשים" })).toHaveCount(0);
  await expect(sheet.getByRole("link", { name: "ייבוא" })).toHaveCount(0);
  await sheet.getByRole("link", { name: "אדמין" }).dispatchEvent("click");
  await page.waitForURL("**/admin");
  for (const name of ["ייבוא", "שיוך אוטומטי", "הקלטות", "סטטיסטיקה", "משימות"]) {
    await expect(page.locator("main").getByRole("link", { name })).toBeVisible();
  }
});

test("/watch: the admin adds a tapped word, in its base form, as an unverified card", async ({ page }) => {
  await login(page);
  await page.route("**/api/mobile/deck", (r) => r.fulfill({ json: { generated_at: new Date().toISOString(), cards: [], reviews: [], audio: {} } }));
  await page.route("**/api/mobile/sync", (r) => r.fulfill({ json: { ok: true, applied: 0 } }));
  await page.route("**/api/media/test-item", (r) =>
    r.fulfill({
      json: {
        item: { title: "סצנה", source_url: null, glosses: { "חאכמ": "שליט" } },
        media_url: null,
        segments: [{ id: "seg-1", idx: 0, start_sec: 0, end_sec: 5, ar: "عن حاكم", translit: "עַן חַאכֶּם", he: "על שליט", verified: false }],
      },
    })
  );
  const posted: Record<string, string>[] = [];
  await page.route("**/api/watch/add-card", (r) => {
    posted.push(r.request().postDataJSON());
    return r.fulfill({ json: { card_id: "new", existing: false } });
  });
  // The word comes back as its base form with all its forms, checked against Madrasa
  await page.route("**/api/watch/base-form", (r) =>
    r.fulfill({
      json: { translit: "חַאכֶּם / חֻכַּאם", arabic: "حاكم / حكّام", meaning: "שליט / שליטים", seen: "", madrasa: { agrees: true, entries: [] } },
    })
  );
  await page.goto("/watch/test-item", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "חַאכֶּם" }).first().click();
  await page.getByTestId("add-card").click();
  await expect(page.getByTestId("base-translit")).toHaveValue("חַאכֶּם / חֻכַּאם");
  await expect(page.getByText("✓ תואם מדרסה")).toBeVisible();
  await page.getByTestId("add-base-word").click();
  await expect(page.getByTestId("add-base-word")).toHaveText("נוסף ככרטיס ✓ (לא מאומת)");
  expect(posted[0]).toMatchObject({ word: "חַאכֶּם / חֻכַּאם", arabic: "حاكم / حكّام", meaning: "שליט / שליטים", source: "סצנה" });
});
