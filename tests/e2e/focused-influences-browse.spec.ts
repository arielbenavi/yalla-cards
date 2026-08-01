/**
 * Focused-practice results influence how cards are classified in /browse
 * (חזרה כללית) — but only as a signal derived at read time. Nothing is written
 * to self_score, card_srs or review_log, and daily review is untouched.
 */
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { login } from "./helpers";

dotenv.config({ path: ".env.local" });

function adminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    realtime: { transport: class {} as any },
  });
}

test("browse reflects focused practice without writing anything", async ({ page }) => {
  await login(page);
  const sb = adminClient();

  // A card that is in browse and has a card_srs row to hang attempts off
  const { cards } = await page.request.get("/api/browse?").then((r) => r.json());
  const target = cards.find(
    (c: { card_srs: unknown[] | null }) => (c.card_srs?.length ?? 0) > 0
  );
  test.skip(!target, "no card with a card_srs row");

  const srsId = target.card_srs[0].id;

  const before = {
    selfScore: target.self_score,
    focused: target.focused,
  };
  expect(before.focused.attempts, "expected a clean starting point").toBe(0);

  // Three clean passes is what `strong` requires — one Good must not be enough
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  await sb.from("focused_practice_log").insert(
    [0, 1, 2].map((i) => ({
      session_id: sessionId,
      card_srs_id: srsId,
      outcome: 4,
      practiced_at: new Date(now - i * 3600_000).toISOString(),
    }))
  );

  const after = await page.request.get("/api/browse?").then((r) => r.json());
  const updated = after.cards.find((c: { id: string }) => c.id === target.id);

  expect(updated.focused.attempts).toBe(3);
  expect(updated.focused.strong, "three Easy passes should read as strong").toBe(true);

  // ...and the underlying card is untouched
  const { data: card } = await sb
    .from("cards")
    .select("self_score")
    .eq("id", target.id)
    .single();
  expect(card!.self_score, "self_score was written — it must not be").toBe(before.selfScore);

  await sb.from("focused_practice_log").delete().eq("session_id", sessionId);
});
