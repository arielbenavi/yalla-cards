/**
 * Focused practice (note ac2ed4f2) must be a practice layer, not a second
 * scheduler. It reads FSRS state and writes only focused_practice_log.
 *
 * The existing reversibility spec compares row counts, which would miss an
 * in-place update to due/stability/difficulty on a row that already exists.
 * This one hashes the actual scheduling fields.
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

/** Every field FSRS owns, for every row — not just the count. */
async function fsrsFingerprint(): Promise<string> {
  const sb = adminClient();
  const rows: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb
      .from("card_srs")
      .select("id, due, stability, difficulty, reps, lapses, state, last_review")
      .order("id")
      .range(from, from + 999);
    if (!data?.length) break;
    rows.push(
      ...data.map(
        (r) =>
          `${r.id}|${r.due}|${r.stability}|${r.difficulty}|${r.reps}|${r.lapses}|${r.state}|${r.last_review}`
      )
    );
    if (data.length < 1000) break;
  }
  const { count } = await sb.from("review_log").select("*", { count: "exact", head: true });
  return `${count}::${rows.join("\n")}`;
}

test.describe("focused practice never writes FSRS state", () => {
  test("queue endpoint is read-only", async ({ page }) => {
    await login(page);
    const before = await fsrsFingerprint();

    const res = await page.request.get("/api/focused/queue?minutes=20");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.cards)).toBe(true);

    expect(await fsrsFingerprint(), "building a session mutated FSRS state").toBe(before);
  });

  test("logging an attempt writes only to focused_practice_log", async ({ page }) => {
    await login(page);

    const { cards } = await page.request
      .get("/api/focused/queue?minutes=15")
      .then((r) => r.json());
    test.skip(cards.length === 0, "no eligible cards for focused practice");

    const sb = adminClient();
    const before = await fsrsFingerprint();
    const { count: logsBefore } = await sb
      .from("focused_practice_log")
      .select("*", { count: "exact", head: true });

    const sessionId = crypto.randomUUID();
    // Grade Again — the outcome most likely to tempt a scheduler write
    const post = await page.request.post("/api/focused/log", {
      data: {
        session_id: sessionId,
        card_srs_id: cards[0].card_srs_id,
        outcome: 1,
        attempt_index: 1,
        latency_ms: 4200,
      },
    });
    expect(post.ok()).toBe(true);

    expect(await fsrsFingerprint(), "logging an attempt mutated FSRS state").toBe(before);

    const { count: logsAfter } = await sb
      .from("focused_practice_log")
      .select("*", { count: "exact", head: true });
    expect(logsAfter).toBe((logsBefore ?? 0) + 1);

    // Clean up this test's own rows so repeat runs stay deterministic
    await sb.from("focused_practice_log").delete().eq("session_id", sessionId);
  });

  test("a card practiced in the last 12h is excluded next time", async ({ page }) => {
    await login(page);
    const sb = adminClient();

    const { cards } = await page.request
      .get("/api/focused/queue?minutes=30")
      .then((r) => r.json());
    test.skip(cards.length === 0, "no eligible cards");

    const target = cards[0].card_srs_id;
    const sessionId = crypto.randomUUID();
    await sb
      .from("focused_practice_log")
      .insert({ session_id: sessionId, card_srs_id: target, outcome: 3 });

    const after = await page.request
      .get("/api/focused/queue?minutes=30")
      .then((r) => r.json());
    const stillThere = after.cards.some(
      (c: { card_srs_id: string }) => c.card_srs_id === target
    );
    expect(stillThere, "cooldown not applied — card reappeared immediately").toBe(false);

    await sb.from("focused_practice_log").delete().eq("session_id", sessionId);
  });
});
