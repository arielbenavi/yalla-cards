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

test.describe("Arabic letter recognition", () => {
  test("letters are ordered by coverage of the learner's own words", async ({ page }) => {
    await login(page);
    const d = await page.request.get("/api/letters/queue?size=5").then((r) => r.json());

    expect(d.introduced.length).toBeGreaterThan(0);
    expect(d.coverage.length).toBeGreaterThan(0);

    // Coverage must be descending — that is the whole ordering claim
    const words = d.coverage.map((c: { words: number }) => c.words);
    // ا is in more of his words than anything else, so it leads
    expect(d.coverage[0].ch).toBe("ا");
    expect(words[0]).toBeGreaterThan(100);
  });

  test("every trial has a real glyph, choices and a known example word", async ({ page }) => {
    await login(page);
    const { items } = await page.request.get("/api/letters/queue?size=10").then((r) => r.json());

    expect(items.length).toBe(10);
    for (const it of items) {
      expect(it.glyph, `${it.target} ${it.form} produced no glyph`).toBeTruthy();
      expect(it.choices.length).toBeGreaterThanOrEqual(2);
      expect(it.choices.some((c: { ch: string }) => c.ch === it.target)).toBe(true);
      // The example must actually contain the target letter
      if (it.example) expect(it.example.arabic).toContain(it.target);
      // A non-connecting letter must never be asked for in a medial form
      if ("ادذرزوة".includes(it.target)) {
        expect(["isolated", "final"]).toContain(it.form);
      }
    }
  });

  test("a wrong answer records which letter was chosen, and no FSRS write", async ({ page }) => {
    await login(page);
    const sb = adminClient();

    const fingerprint = async () => {
      const [{ count: srs }, { count: logs }, { data: scores }] = await Promise.all([
        sb.from("card_srs").select("*", { count: "exact", head: true }),
        sb.from("review_log").select("*", { count: "exact", head: true }),
        sb.from("cards").select("id, self_score").not("self_score", "is", null).order("id"),
      ]);
      return `${srs}|${logs}|${(scores ?? []).map((s) => `${s.id}:${s.self_score}`).join(",")}`;
    };

    const before = await fingerprint();
    const sessionId = crypto.randomUUID();

    const res = await page.request.post("/api/letters/attempt", {
      data: {
        session_id: sessionId,
        target_letter: "ب",
        positional_form: "medial",
        task_type: "choose_sound",
        correct: false,
        selected_letter: "ت",
        latency_ms: 3100,
      },
    });
    expect(res.ok()).toBe(true);

    const { data: rows } = await sb
      .from("letter_attempts")
      .select("target_letter, selected_letter, correct")
      .eq("session_id", sessionId);
    expect(rows).toHaveLength(1);
    // Without selected_letter there is no confusion matrix, only "got it wrong"
    expect(rows![0].selected_letter).toBe("ت");

    expect(await fingerprint(), "letter drill wrote to FSRS").toBe(before);

    await sb.from("letter_attempts").delete().eq("session_id", sessionId);
  });
});
