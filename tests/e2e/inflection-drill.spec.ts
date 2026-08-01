import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("inflection matching drill", () => {
  test("serves verified verbs and paradigms, never Arabic-script columns", async ({ page }) => {
    await login(page);
    const { sets, total } = await page.request
      .get("/api/inflection-drill")
      .then((r) => r.json());

    expect(total).toBeGreaterThan(20);
    for (const s of sets) {
      expect(s.slots.length, `${s.id} has too few slots to be a drill`).toBeGreaterThanOrEqual(3);
      for (const slot of s.slots) {
        expect(slot.person).toBeTruthy();
        expect(slot.answer).toBeTruthy();
        // The learner reads transliteration; a box expecting عني tests nothing
        expect(slot.answer, `${s.id} serves Arabic script`).not.toMatch(/[؀-ۿ]/);
      }
    }
  });

  test("a correct placement sticks and a wrong one does not", async ({ page }) => {
    await login(page);

    const { sets } = await page.request.get("/api/inflection-drill").then((r) => r.json());
    const target = sets.find((s: { title: string }) => s.title.includes("שם עצם זכר"));
    test.skip(!target, "possessive drill not present");

    const tip = page.getByRole("button", { name: "הבנתי" });
    await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    if (await tip.isVisible().catch(() => false)) {
      await tip.click();
      await tip.waitFor({ state: "detached" });
    }

    await page.getByRole("link", { name: "התאמת הטיות" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: new RegExp(target.title) }).first().click();

    const first = target.slots[0];
    const other = target.slots.find(
      (s: { person: string }) => s.person !== first.person
    );

    // Pick the form belonging to `first`, then drop it on the WRONG person
    await page.getByRole("button", { name: first.answer, exact: true }).click();
    await page.getByRole("button", { name: new RegExp(other.person) }).first().click();
    // Still in hand, box still empty
    await expect(page.getByRole("button", { name: first.answer, exact: true })).toBeVisible();

    // Now the right box
    await page.getByRole("button", { name: new RegExp(first.person) }).first().click();
    await expect(page.getByText("1 / " + target.slots.length)).toBeVisible();
  });
});
