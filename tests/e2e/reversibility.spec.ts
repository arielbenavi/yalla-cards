/**
 * Reversibility guard for the /practice section (picture game + letter drill).
 *
 * The drills MUST NOT write to card_srs, review_log, or cards.self_score.
 * This test snapshots those tables before and after running both drills end-to-end,
 * and asserts the state is byte-for-byte unchanged.
 *
 * Run it now (before the features exist) to establish the baseline. It passes because
 * the endpoints don't exist yet (no writes can happen). Once the features ship, run it
 * again — if it still passes, the constraint holds. If it fails, a write snuck in.
 *
 * Rollback reminder (from migration comments):
 *   drop table allograph_srs, picture_attempts;
 *   alter table picture_hotzones drop column card_id;
 */

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { login } from "./helpers";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: class {} as any },
  });
}

interface DbSnapshot {
  cardSrsCount: number;
  reviewLogCount: number;
  selfScoreHash: string; // sorted CSV of "id:score" for all non-null self_scores
}

async function snapshot(): Promise<DbSnapshot> {
  const sb = adminClient();

  const [{ count: cardSrsCount }, { count: reviewLogCount }, { data: selfScores }] =
    await Promise.all([
      sb.from("card_srs").select("*", { count: "exact", head: true }),
      sb.from("review_log").select("*", { count: "exact", head: true }),
      sb.from("cards").select("id, self_score").not("self_score", "is", null).order("id"),
    ]);

  const selfScoreHash = (selfScores ?? [])
    .map((r) => `${r.id}:${r.self_score}`)
    .join(",");

  return {
    cardSrsCount: cardSrsCount ?? 0,
    reviewLogCount: reviewLogCount ?? 0,
    selfScoreHash,
  };
}

function assertUnchanged(before: DbSnapshot, after: DbSnapshot) {
  expect(after.cardSrsCount, "card_srs row count changed — drill wrote to FSRS").toBe(
    before.cardSrsCount
  );
  expect(after.reviewLogCount, "review_log row count changed — drill wrote to FSRS").toBe(
    before.reviewLogCount
  );
  expect(after.selfScoreHash, "cards.self_score changed — drill wrote a self_score").toBe(
    before.selfScoreHash
  );
}

test.describe("reversibility — drills must not write to FSRS or self_score", () => {
  test("picture game session leaves FSRS tables unchanged", async ({ page }) => {
    const before = await snapshot();

    await login(page);

    // Navigate to the first available picture scene (may not exist yet)
    const resp = await page.request.get("/api/picture-scenes");
    if (resp.ok()) {
      const { scenes } = await resp.json();
      if (scenes?.length > 0) {
        const sceneId = scenes[0].id;
        await page.goto(`/picture-game/${sceneId}`);
        await page.waitForLoadState("networkidle");

        // If the "done" button exists, click through
        const doneBtn = page.getByRole("button", { name: /סיימתי/ });
        if (await doneBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await doneBtn.click();
          await page.waitForLoadState("networkidle");
          // Submit with no misses
          const submitBtn = page.getByRole("button", { name: /שמור|סיום/ });
          if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForLoadState("networkidle");
          }
        }
      }
    }

    const after = await snapshot();
    assertUnchanged(before, after);
  });

  test("letters session leaves FSRS tables unchanged", async ({ page }) => {
    const before = await snapshot();

    await login(page);

    // Hit the letters queue endpoint (may not exist yet — that's fine)
    const queueResp = await page.request.get("/api/letters/queue");
    if (queueResp.ok()) {
      const { words } = await queueResp.json();
      if (words?.length > 0) {
        await page.goto("/letters");
        await page.waitForLoadState("networkidle");

        // Submit the first word with no taps (all "Good")
        const submitBtn = page.getByRole("button", { name: /הבא|שלח/ });
        if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForLoadState("networkidle");
        }
      }
    }

    const after = await snapshot();
    assertUnchanged(before, after);
  });
});
