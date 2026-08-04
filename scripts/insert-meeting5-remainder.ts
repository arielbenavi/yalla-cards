// Inserts the last מפגש 5 words (scripts/data/meeting5-remainder.ts).
//
// HELD_ON_QAF is deliberately not written — see the comment there.
//
//   npx tsx scripts/insert-meeting5-remainder.ts          # dry run
//   npx tsx scripts/insert-meeting5-remainder.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { REMAINDER, HELD_ON_QAF } from "./data/meeting5-remainder";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 5";
const strip = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const rows = REMAINDER.map((v) => ({ ...v, translit: normalizeMarks(v.translit) }));
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
  console.log(`${rows.length} פסקים · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) {
    console.log(`  ${r.translit.padEnd(20)} ${r.ar.padEnd(14)} ${r.he}${r.was ? `   (היה: ${r.was})` : ""}`);
  }
  console.log(`\n⏸ מוחזקות עד להכרעת ה-ق (${HELD_ON_QAF.length}):`);
  for (const h of HELD_ON_QAF) console.log(`  ${h.translit.padEnd(20)} ${h.ar.padEnd(14)} ${h.he}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id ?? null;

  for (const r of toAdd) {
    const notes = [r.note, r.was ? `הספר/ההערות: ${r.was}` : null].filter(Boolean).join(" · ");
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: notes || null,
        item_type: "word",
        lesson_id: lessonId,
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
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים ל"${LESSON}", כולם עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
