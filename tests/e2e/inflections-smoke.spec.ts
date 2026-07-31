import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// The 0013 seed put Modern Standard Arabic in `forms`, and 0020 + the paradigm
// writer overwrote it with Palestinian. This guards the shape /inflections reads:
// a forms object keyed by person, one entry per person, non-empty.
test.describe("/inflections after the paradigm rewrite", () => {
  test("queue returns verbs with a full 8-person present tense", async ({ page }) => {
    await login(page);

    const res = await page.request.get("/api/inflections/queue");
    expect(res.ok()).toBe(true);
    const body = await res.json();

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.all_verbs.length).toBeGreaterThan(0);

    const PERSONS = ["ana", "inta", "inti", "huwwe", "hiyye", "ihna", "intu", "hum"];
    for (const verb of body.all_verbs) {
      expect(verb.forms, `${verb.root} has no forms`).toBeTruthy();
      for (const p of PERSONS) {
        expect(verb.forms[p], `${verb.root}.${p} missing`).toBeTruthy();
      }
    }

    // The Palestinian 1pl present prefix is مِن-, never the MSA بن-/ن-.
    // Every verb chatifai supplied uses it, so this catches a regression to the seed.
    const rah = body.all_verbs.find((v: { root: string }) => v.root === "راح");
    expect(rah).toBeTruthy();
    expect(rah.forms.ihna).toBe("منروح");
  });

  test("the page renders without crashing on the new data", async ({ page }) => {
    await login(page);
    await page.goto("/inflections", { waitUntil: "domcontentloaded" });

    const tipDismiss = page.getByRole("button", { name: "הבנתי" });
    await tipDismiss.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    if (await tipDismiss.isVisible().catch(() => false)) await tipDismiss.click();

    await page.waitForLoadState("networkidle");

    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors, errors.join("\n")).toHaveLength(0);
  });
});
