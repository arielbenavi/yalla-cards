// Inserts the 21 מפגש 5 practice sentences and the בֵּלֵפוֹן card.
//
// The sentences are the lesson's own drill for the אִלִי/עִנְד/מַע distinction,
// so they go in as `sentence` cards rather than words — each one contrasts the
// three possession words in context, which is the thing the tables cannot teach.
//
//   npx tsx scripts/insert-meeting5-sentences.ts          # dry run
//   npx tsx scripts/insert-meeting5-sentences.ts --apply
import { config } from "dotenv";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { createClient } from "@supabase/supabase-js";
import { SENTENCES, BELEFON } from "./data/meeting5-sentences";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 5";
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

const HEBREW = /[א-ת]/;
const ARABIC = /[ء-ي]/;

async function main() {
  const rows = [
    { ...BELEFON, item_type: "word" as const },
    ...SENTENCES.map((s) => ({
      translit: s.translit,
      ar: s.ar,
      he: s.he,
      note: s.note,
      item_type: "sentence" as const,
    })),
  ];

  // Normalise codepoints BEFORE validating, then refuse anything still mixed.
  for (const r of rows) {
    r.translit = normalizeMarks(r.translit);
    assertClean(r.translit.slice(0, 30), r.translit, r.ar);
    if (!r.he?.trim()) throw new Error(`אין פירוש עברי: ${r.translit}`);
  }

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (!data?.length) break;
    for (const c of data) known.add(strip(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const toAdd = rows.filter((r) => !known.has(strip(r.translit)));
  console.log(`${rows.length} פריטים · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  [${r.item_type}] ${r.translit.slice(0, 60)}`);

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id ?? null;

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        item_type: r.item_type,
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
  console.log(`\n✅ נוספו ${toAdd.length}, כולם עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
