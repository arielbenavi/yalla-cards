// Preply Roa K. 4 (2026-11-15): Ariel's notes from the lesson (scripts/data/preply-roa-4.ts).
// A row is skipped when any of its forms is already in the deck. Unverified; only each new
// card's own card_srs row is written.
//   npx tsx scripts/insert-preply-roa-4.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fixBet } from "../lib/word-lookup";
import { norm } from "../lib/dialect-sources";
import { ROWS, FORCE } from "./data/preply-roa-4";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");

const parts = (ar: string) => ar.split("/").map((x) => norm(x.replace(/[«»"؟?،,]/g, ""))).filter(Boolean);

(async () => {
  const existing = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("arabic_script, translit_nikud").range(from, from + 999);
    if (error) throw error;
    for (const c of data) if (c.arabic_script) for (const p of parts(c.arabic_script)) existing.set(p, c.translit_nikud);
    if (data.length < 1000) break;
  }
  const fresh = ROWS.filter(([tr, ar]) => FORCE.has(tr) || !parts(ar).some((p) => existing.has(p)));
  for (const [tr, ar] of ROWS) {
    const hit = parts(ar).find((p) => existing.has(p));
    if (hit && !FORCE.has(tr)) console.log("skip (in deck):", tr, "·", existing.get(hit));
  }
  console.log(`${fresh.length} new of ${ROWS.length}`);
  if (!APPLY) return console.log("dry run — add --apply");
  const { data: lesson, error } = await sb.from("lessons")
    .insert({ date: "2026-11-15", title: "Preply Roa K. 4", source: "preply", teacher: "Roa K.", meeting: 4 }).select("id").single();
  if (error) throw error;
  for (const [tr, ar, he, type, notes] of fresh) {
    const { data: card, error: e1 } = await sb.from("cards").insert({
      translit_nikud: fixBet(tr), arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
      lesson_id: lesson.id, chatifai_verified: false,
    }).select("id").single();
    if (e1) throw e1;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log("✅ lesson", lesson.id, "·", fresh.length, "cards");
})().catch((e) => { console.error(e.message ?? e); process.exit(1); });
