import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// This test never grades a card. Revealing an answer is read-only; pressing a
// rating button would write to card_srs and review_log against the real DB.
test.describe("admin clip-range editing from /review", () => {
  test("pencil opens the range editor for a card with audio", async ({ page }) => {
    await login(page);

    // Pick a single card that is known to have a clip, via mode=selected, so we
    // never have to page through the queue to find one.
    const queue = await page
      .request.get("/api/review/queue?mode=all")
      .then((r) => r.json());
    const withAudio = (queue.cards ?? []).find(
      (c: { audio_url: string | null }) => c.audio_url
    );
    test.skip(!withAudio, "no card with a clip in the review queue");

    await page.goto(`/review?ids=${withAudio.card_srs_id}`, {
      waitUntil: "domcontentloaded",
    });

    // The daily tip is a modal that mounts in an effect, so it can appear after
    // first paint. Wait for it, then dismiss — otherwise it intercepts clicks.
    const tipDismiss = page.getByRole("button", { name: "הבנתי" });
    await tipDismiss.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    if (await tipDismiss.isVisible().catch(() => false)) {
      await tipDismiss.click();
      await tipDismiss.waitFor({ state: "detached" });
    }

    // The pencil sits next to the play button, which renders only after reveal
    await page.getByRole("button", { name: "הצג תשובה" }).click();

    const pencil = page.getByTitle("ערוך טווח הקלטה");
    await expect(pencil).toBeVisible();

    await pencil.click();
    await expect(page.getByRole("heading", { name: "ערוך טווח הקלטה" })).toBeVisible();
    await expect(page.getByPlaceholder("0.0").first()).toBeVisible();
  });
});
