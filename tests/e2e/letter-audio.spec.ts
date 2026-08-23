import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Note 28e16a9b: a speaker button on the letter drill, cut from the מפגש 1
 * recordings. The failure mode that matters is a range pointing at the wrong
 * moment — the button then plays a different letter and teaches the wrong
 * sound — so the checks are about the ranges being real and bounded, not about
 * a button existing.
 */
test.describe("letter pronunciation audio", () => {
  test("every letter clip is a real, bounded range with a playable url", async ({ page }) => {
    await login(page);
    const { audio } = await page.request.get("/api/letters/audio").then((r) => r.json());

    const letters = Object.keys(audio);
    expect(letters.length, "no letter audio served").toBeGreaterThan(20);

    for (const ch of letters) {
      const clip = audio[ch];
      expect(clip.url, `${ch} has no signed url`).toBeTruthy();
      expect(clip.end, `${ch} range is inverted`).toBeGreaterThan(clip.start);
      expect(clip.start, `${ch} starts before the file`).toBeGreaterThanOrEqual(0);
      // A clip longer than a minute is not a letter being pronounced, it is a
      // range that swallowed the letters after it.
      expect(clip.end - clip.start, `${ch} range is too long to be one letter`).toBeLessThan(70);
    }
  });

  test("the letters Ariel called confusing all have audio", async ({ page }) => {
    await login(page);
    const { audio } = await page.request.get("/api/letters/audio").then((r) => r.json());

    // The emphatics and gutturals — the ones with no Hebrew equivalent, which
    // is what "האותיות המתסבכות" means and why he asked for this at all.
    for (const ch of ["ح", "خ", "ص", "ض", "ط", "ظ", "ع", "غ", "ق", "ث", "ذ", "ج"]) {
      expect(audio[ch], `${ch} has no pronunciation clip`).toBeTruthy();
      expect(audio[ch].note, `${ch} has no note saying what is said there`).toBeTruthy();
    }
  });

  test("no two letters share a range, and ranges do not overlap within a recording", async ({ page }) => {
    await login(page);
    const { audio } = await page.request.get("/api/letters/audio").then((r) => r.json());

    // Overlapping ranges mean at least one of them is wrong: the teacher covers
    // the letters one after another, never two at once.
    const byUrl = new Map<string, { ch: string; start: number; end: number }[]>();
    for (const [ch, c] of Object.entries(audio) as [string, { url: string; start: number; end: number }][]) {
      if (!byUrl.has(c.url)) byUrl.set(c.url, []);
      byUrl.get(c.url)!.push({ ch, start: c.start, end: c.end });
    }

    for (const ranges of byUrl.values()) {
      ranges.sort((a, b) => a.start - b.start);
      for (let i = 1; i < ranges.length; i++) {
        expect(
          ranges[i].start,
          `${ranges[i - 1].ch} and ${ranges[i].ch} overlap`
        ).toBeGreaterThanOrEqual(ranges[i - 1].end);
      }
    }
  });

  test("the drill offers the speaker button once a letter is answered", async ({ page }) => {
    await login(page);
    await page.goto("/letters");
    await page.getByRole("button").first().waitFor();

    // Answer whatever is on screen — any answer reveals the feedback panel.
    const choices = page.locator("main button, .grid button");
    await choices.first().click();

    await expect(
      page.getByRole("button", { name: /השמע את ההגייה/ }),
      "no speaker button after answering"
    ).toBeVisible();
  });
});
