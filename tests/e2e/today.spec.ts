import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("daily checklist", () => {
  test("login lands on the checklist and it lists review plus the drills", async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/today/);

    await expect(page.getByRole("heading", { name: "היום" })).toBeVisible();

    // Scoped to the checklist: the nav carries links with the same labels, so an
    // unscoped locator matches the nav entry too and proves nothing about the
    // checklist rendering.
    const list = page.locator("main");
    for (const label of ["חזרה יומית", "תרגול הטיות", "אימון ממוקד", "תרגול שיחה"]) {
      await expect(
        list.getByRole("link", { name: new RegExp(label) }),
        `${label} missing from the checklist`
      ).toBeVisible();
    }
  });

  test("the review's tick is derived, and cannot be written", async ({ page }) => {
    await login(page);

    // The review's completion comes from its own queue. Accepting a POST for it
    // would create a second, forgeable source of truth for the one thing that is
    // not allowed to drift — "חזרה יומית לא נוגעים".
    const res = await page.request.post("/api/today", { data: { task: "review" } });
    expect(res.status()).toBe(400);

    const { items } = await page.request.get("/api/today").then((r) => r.json());
    const review = items.find((i: { key: string }) => i.key === "review");
    expect(review, "review item missing from the checklist").toBeTruthy();
    // Derived, so it agrees with the queue rather than with any stored mark.
    const queue = await page.request.get("/api/review/queue").then((r) => r.json());
    const outstanding = queue.cards.length + queue.remaining_due + queue.remaining_new;
    expect(review.done).toBe(outstanding === 0);
  });

  test("marking a drill is idempotent and shows up on the checklist", async ({ page }) => {
    await login(page);

    // Twice — the unique (day, task) constraint should make the repeat a no-op
    // rather than an error or a second row.
    for (let i = 0; i < 2; i++) {
      const res = await page.request.post("/api/today", { data: { task: "inflections" } });
      expect(res.ok()).toBeTruthy();
    }

    const { items } = await page.request.get("/api/today").then((r) => r.json());
    const drill = items.find((i: { key: string }) => i.key === "inflections");
    expect(drill.done).toBe(true);
  });

  test("an unknown task is rejected", async ({ page }) => {
    await login(page);
    const res = await page.request.post("/api/today", { data: { task: "nonsense" } });
    expect(res.status()).toBe(400);
  });

  /**
   * Note 3e564c9f: the nudge is only useful if it hands him a situation. Three
   * suggestions that lead to an unverified dialogue, or to the wrong tab, would
   * be worse than no nudge — he would tap one and land nowhere.
   */
  test("the conversation prompt offers real, verified situations to start", async ({ page }) => {
    await login(page);
    const { items } = await page.request.get("/api/today").then((r) => r.json());
    const convo = items.find((i: { key: string }) => i.key === "conversation");
    expect(convo, "conversation missing from the checklist").toBeTruthy();

    const { dialogues } = await page.request.get("/api/dialogues").then((r) => r.json());
    const verified = new Set(dialogues.map((d: { key: string }) => d.key));
    expect(verified.size, "no verified dialogues to suggest").toBeGreaterThan(0);

    expect(convo.suggestions.length).toBeGreaterThan(0);
    expect(convo.suggestions.length).toBeLessThanOrEqual(3);
    for (const s of convo.suggestions) {
      const key = new URL(s.href, "http://x").searchParams.get("scene");
      expect(verified.has(key), `suggested scene ${key} is not a verified dialogue`).toBeTruthy();
      expect(s.label, `scene ${key} has no Hebrew label`).toBeTruthy();
      expect(s.label).not.toBe(key);
    }
  });

  test("a suggestion opens that situation, not the situation list", async ({ page }) => {
    await login(page);
    const { items } = await page.request.get("/api/today").then((r) => r.json());
    const convo = items.find((i: { key: string }) => i.key === "conversation");

    await page.goto(convo.suggestions[0].href);
    // Being inside a scene means there is a way back out of it.
    await expect(
      page.getByRole("button", { name: "חזרה לרשימה" }),
      "the deep link did not open the scene"
    ).toBeVisible({ timeout: 15000 });
  });

  test("conversation is markable and review still is not", async ({ page }) => {
    await login(page);
    expect((await page.request.post("/api/today", { data: { task: "conversation" } })).ok()).toBeTruthy();
    expect((await page.request.post("/api/today", { data: { task: "review" } })).status()).toBe(400);
  });
});
