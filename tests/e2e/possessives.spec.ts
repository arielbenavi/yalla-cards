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

test.describe("possessive-suffix drill", () => {
  test("every served trial is a true minimal pair", async ({ page }) => {
    await login(page);
    const { items } = await page.request
      .get("/api/possessives/queue?size=20")
      .then((r) => r.json());

    expect(items.length).toBeGreaterThan(0);

    for (const it of items) {
      expect(it.options).toHaveLength(2);

      const [a, b] = it.options.map((o: { sentence: string }) => o.sentence.split(/\s+/));
      expect(a.length, "options differ in length").toBe(b.length);

      // Exactly one word may differ — the inflected form itself
      const differing = a.filter((w: string, i: number) => w !== b[i]);
      expect(differing.length, `${it.prompt_he} differs in ${differing.length} words`).toBe(1);

      // Nothing may resolve the person for free
      for (const o of it.options) {
        for (const leak of ["אַנַא", "הֻוֵּ", "הִיֵּ", "תַבַּע"]) {
          expect(o.sentence, `leaking token ${leak}`).not.toContain(leak);
        }
      }

      // The correct answer must be among the options
      expect(it.options.some((o: { feature: string }) => o.feature === it.target_feature)).toBe(
        true
      );
    }
  });

  test("only chatifai-verified forms are served", async ({ page }) => {
    await login(page);
    const sb = adminClient();

    const { data: unverified } = await sb
      .from("possessive_forms")
      .select("form_translit")
      .eq("chatifai_verified", false);

    const { items } = await page.request
      .get("/api/possessives/queue?size=20")
      .then((r) => r.json());
    const served = new Set(
      items.flatMap((i: { options: { sentence: string }[] }) =>
        i.options.map((o) => o.sentence.split(/\s+/)[0])
      )
    );

    for (const u of unverified ?? []) {
      expect(served.has(u.form_translit), `unverified ${u.form_translit} was served`).toBe(false);
    }
  });

  test("logging an attempt writes no FSRS state", async ({ page }) => {
    await login(page);
    const sb = adminClient();

    const fingerprint = async () => {
      const [{ count: srs }, { count: logs }] = await Promise.all([
        sb.from("card_srs").select("*", { count: "exact", head: true }),
        sb.from("review_log").select("*", { count: "exact", head: true }),
      ]);
      return `${srs}|${logs}`;
    };

    const before = await fingerprint();
    const sessionId = crypto.randomUUID();

    const res = await page.request.post("/api/possessives/attempt", {
      data: {
        session_id: sessionId,
        stage: 1,
        base_translit: "בֵּית",
        target_feature: "her",
        chosen_feature: "his",
        contrast_with: "his",
        correct: false,
        latency_ms: 2400,
      },
    });
    expect(res.ok()).toBe(true);

    const { data: rows } = await sb
      .from("possessive_attempts")
      .select("chosen_feature")
      .eq("session_id", sessionId);
    // Recording WHICH feature was chosen is what makes the log diagnostic
    expect(rows![0].chosen_feature).toBe("his");

    expect(await fingerprint(), "possessive drill wrote FSRS state").toBe(before);

    await sb.from("possessive_attempts").delete().eq("session_id", sessionId);
  });
});
