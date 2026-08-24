import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/** The shape /api/inflection-drill serves. Shared by the tests below. */
type DrillSet = {
  id: string;
  group: string;
  title: string;
  subtitle?: string | null;
  slots: { person: string; answer: string }[];
};

/**
 * Person labels are prose, not identifiers — `זאת (קרוב, נ)` is a real one.
 * `new RegExp(label)` turns its parentheses into a capture group, so the pattern
 * silently stops matching the very button it was built from and the click waits
 * out the full timeout. Escape before matching.
 */
const rx = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

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

  test("every set carries a topic group", async ({ page }) => {
    await login(page);
    const { sets } = await page.request.get("/api/inflection-drill").then((r) => r.json());

    // The list is one entry per topic, not per table — 77 flat buttons made
    // choosing what to practise a task of its own (note 17f19ad7). A set with no
    // group would be unreachable from the list entirely.
    for (const s of sets) {
      expect(s.group, `${s.id} has no group`).toBeTruthy();
    }
    const groups = new Set(sets.map((s: { group: string }) => s.group));
    expect(groups.size, "grouping collapsed to one bucket").toBeGreaterThan(1);
    expect(groups.size, "grouping barely reduced the list").toBeLessThan(sets.length / 3);
  });

  test("a correct placement sticks and a wrong one does not", async ({ page }) => {
    await login(page);

    const { sets } = await page.request.get("/api/inflection-drill").then((r) => r.json());
    const all = sets as DrillSet[];

    // Pick a group with exactly one table, so the shuffle inside a run cannot
    // change which table opens. Also require every form in it to be distinct —
    // syncretic tables are legitimate (מפגש 6 past tense has אַנַא and אִנְתֵ both
    // as כַּתַבְּת) but two identical tiles make `exact: true` ambiguous, which is
    // a limitation of the locator, not of the drill.
    const counts = new Map<string, number>();
    for (const s of all) counts.set(s.group, (counts.get(s.group) ?? 0) + 1);
    const distinct = (s: DrillSet) => new Set(s.slots.map((x) => x.answer)).size === s.slots.length;
    const target = all.find((s) => counts.get(s.group) === 1 && distinct(s)) ?? all.find(distinct)!;
    test.skip(!target, "no drill set with distinct forms");

    const tip = page.getByRole("button", { name: "הבנתי" });
    await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    if (await tip.isVisible().catch(() => false)) {
      await tip.click();
      await tip.waitFor({ state: "detached" });
    }

    await page.getByRole("link", { name: "התאמת הטיות" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: rx(target.group) }).first().click();

    const first = target.slots[0];
    const other = target.slots.find((s) => s.person !== first.person)!;

    // Pick the form belonging to `first`, then drop it on the WRONG person
    await page.getByRole("button", { name: first.answer, exact: true }).click();
    await page.getByRole("button", { name: rx(other.person) }).first().click();
    // Still in hand, box still empty
    await expect(page.getByRole("button", { name: first.answer, exact: true })).toBeVisible();

    // Now the right box
    await page.getByRole("button", { name: rx(first.person) }).first().click();
    await expect(page.getByText("1 / " + target.slots.length)).toBeVisible();
  });

  /**
   * מפגש 8 brought the first paradigm with blocked cells: the דַפַע grid marks
   * 13 of its 64 combinations "X", because אַנַא does not pay to itself and
   * אִחְנַא does not pay to us. A drill only completes when every tile is placed,
   * so one X served as a tile makes the table unfinishable — and the learner
   * would be asked to place a form the language does not have.
   */
  test("no drill ever serves a blocked cell as a form", async ({ page }) => {
    await login(page);
    const { sets } = await page.request.get("/api/inflection-drill").then((r) => r.json());

    for (const set of sets as DrillSet[]) {
      for (const slot of set.slots) {
        expect(slot.answer.trim(), `${set.title} serves "X" for ${slot.person}`).not.toBe("X");
        expect(slot.answer.trim(), `${set.title} has an empty answer for ${slot.person}`).not.toBe("");
      }
    }
  });

  test("the מפגש 8 object-suffix grid reached the drill, one table per subject", async ({ page }) => {
    await login(page);
    const { sets } = await page.request.get("/api/inflection-drill").then((r) => r.json());

    const grid = (sets as DrillSet[]).filter((s) => s.id.includes("past_indirect_object_grid") || /דַפַע/.test(s.title));
    expect(grid.length, "the דַפַע grid produced no drills").toBeGreaterThan(0);

    // Every drill carries a Hebrew name for its subject, not a raw column key.
    for (const s of grid) {
      expect(s.title, `${s.id} still shows a raw column key`).not.toMatch(/\b(ana|inta|inti|huwwe|hiyye|ihna|intu|hum)\b/);
    }
  });
});
