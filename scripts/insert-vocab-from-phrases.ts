// Creates cards for the worklist words chatifai ruled worth a card (b4fe5996).
//
// These are words Ariel has already been reading inside stored phrases without
// ever having been taught them on their own — the note's example is אִמְתִחַאן
// sitting inside "יש עלי מבחן מחר". They go in with no lesson, because they came
// from the phrases rather than from any one meeting.
//
//   npx tsx scripts/insert-vocab-from-phrases.ts          # dry run
//   npx tsx scripts/insert-vocab-from-phrases.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { NEW_CARDS, REJECTED } from "./data/vocab-from-phrases";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const rows = NEW_CARDS.map((c) => ({ ...c, translit: normalizeMarks(c.translit) }));
  for (const r of rows) assertClean(r.he, r.translit, r.ar);

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.add(strip(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const toAdd = rows.filter((r) => !known.has(strip(r.translit)));
  console.log(`${rows.length} פסקים · ${rows.length - toAdd.length} כבר קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(14)} ${r.ar.padEnd(10)} ${r.he}`);
  console.log(`\nchatifai פסל ${REJECTED.length}:\n  - ${REJECTED.join("\n  - ")}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        item_type: "word",
        lesson_id: null,
        chatifai_verified: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb
      .from("card_srs")
      .insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים, כולם עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
