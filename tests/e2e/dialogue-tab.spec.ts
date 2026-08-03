import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("stored dialogues on /simulate", () => {
  test("only chatifai-verified dialogues are served", async ({ page }) => {
    await login(page);

    const verified = await page.request.get("/api/dialogues").then((r) => r.json());
    const all = await page.request.get("/api/dialogues?all=1").then((r) => r.json());

    // The invariant is that nothing unverified is ever served. This used to be
    // checked as `all.total > served`, which only held while some dialogues were
    // still unverified — once all 15 were verified it started failing on
    // success. Assert the filter directly instead, so it keeps working whatever
    // the verified count is.
    expect(verified.dialogues.length).toBeLessThanOrEqual(all.total);
    for (const d of verified.dialogues) {
      expect(d.verified, `${d.key} served without verification`).toBe(true);
    }

    const unverified = (all.dialogues ?? []).filter((d: { verified: boolean }) => !d.verified);
    const servedKeys = new Set(verified.dialogues.map((d: { key: string }) => d.key));
    for (const d of unverified) {
      expect(servedKeys.has(d.key), `${d.key} is unverified but served`).toBe(false);
    }
    expect(verified.dialogues.length).toBe(all.total - unverified.length);
  });

  test("walking a dialogue requires answering the choice point", async ({ page }) => {
    await login(page);

    const { dialogues } = await page.request.get("/api/dialogues").then((r) => r.json());
    test.skip(dialogues.length === 0, "no verified dialogue yet");

    // Dismiss the daily tip first — login lands on /review where it renders as a
    // modal, and its backdrop swallows the nav click.
    const tip = page.getByRole("button", { name: "הבנתי" });
    await tip.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    if (await tip.isVisible().catch(() => false)) {
      await tip.click();
      await tip.waitFor({ state: "detached" });
    }

    // Navigate by link — page.goto races the dev server's compile and aborts
    await page.getByRole("link", { name: "שיחה" }).click();

    await page.getByRole("button", { name: "דו-שיח" }).click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /שווארמה/ }).click();

    // Advance until the choice point gates progress
    for (let i = 0; i < 12; i++) {
      const gate = page.getByRole("button", { name: "בחר תשובה כדי להמשיך" });
      if (await gate.isVisible().catch(() => false)) {
        await expect(gate).toBeDisabled();
        await page.getByText("מה היית עונה?").waitFor();
        // Picking an option unblocks it
        await page.locator("button", { hasText: "כַּתִּ" }).first().click();
        await expect(page.getByRole("button", { name: "הבא" })).toBeEnabled();
        return;
      }
      const next = page.getByRole("button", { name: "הבא" });
      if (!(await next.isVisible().catch(() => false))) break;
      await next.click();
    }

    throw new Error("never reached a choice point");
  });

  test("the machine-generated opener was replaced", async ({ page }) => {
    await login(page);
    const { dialogues } = await page.request.get("/api/dialogues").then((r) => r.json());
    const shawarma = dialogues.find((d: { key: string }) => d.key === "shawarma");
    test.skip(!shawarma, "shawarma not verified yet");

    const all = JSON.stringify(shawarma.turns);
    // chatifai: "נשמע כמו אמא שמדברת לילד קטן"
    expect(all).not.toContain("אַטְעִימַכּ");
    // ض is צ׳ in this project, never ד׳
    expect(all).not.toContain("תְפַדַּ");
  });
});
