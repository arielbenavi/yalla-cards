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
    for (const label of ["חזרה יומית", "תרגול הטיות", "אימון ממוקד"]) {
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
});
