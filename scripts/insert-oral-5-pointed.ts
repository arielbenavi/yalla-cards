// The part of מפגש בעפ 5 that arrived already pointed, so needs no chatifai pass.
//
// Two things: the שוּ אַחְ'בַּארַכּ answers, and the two directions paragraphs.
//
// The paragraphs go in as `sentence` cards rather than as a paradigm. A paradigm
// is a table you read; these are the exercise the whole lesson built toward —
// every direction word from the list appears in them in context, which is the
// thing the word list cannot teach — so they belong in the review rotation.
//
// The rest of מפגש בעפ 5 (~70 unpointed entries) waits on chatifai.
//
//   npx tsx scripts/insert-oral-5-pointed.ts          # dry run
//   npx tsx scripts/insert-oral-5-pointed.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";
import { POINTED_PHRASES, DIRECTIONS, ALL_ORAL_5 } from "./data/meeting-oral-5";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש בעל פה 5";
const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;

const fold = (s: string) =>
  s.normalize("NFC")
    .replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "")
    .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ")
    .replace(/ף/g, "פ").replace(/ץ/g, "צ")
    .replace(/[()'"׳״]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const rows = [
    ...POINTED_PHRASES.map((p) => ({
      translit: normalizeMarks(p.translit), he: p.he, note: p.note, item_type: "word" as const,
    })),
    ...DIRECTIONS.map((d, i) => ({
      translit: normalizeMarks(d),
      he: `הכוונה בדרך — פסקה ${i + 1}`,
      note: "טקסט ההכוונה של מפגש בעל פה 5. כל מילות הכיוון של השיעור בהקשר",
      item_type: "sentence" as const,
    })),
  ];

  for (const r of rows) {
    if (ARABIC_LETTER.test(r.translit)) throw new Error(`ערבית בתעתיק: ${r.translit.slice(0, 40)}`);
    if (ARABIC_MARK.test(r.translit)) throw new Error(`סימן ערבי בתעתיק: ${r.translit.slice(0, 40)}`);
  }

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.add(fold(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const toAdd = rows.filter((r) => !known.has(fold(r.translit)));
  const unpointed = ALL_ORAL_5.filter((e) => e.he.trim()).length;
  const blank = ALL_ORAL_5.filter((e) => !e.he.trim());
  const queries = ALL_ORAL_5.filter((e) => e.query);

  console.log(`${rows.length} מנוקדים · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  [${r.item_type}] ${r.translit.slice(0, 66)}`);
  console.log(`\n⏸ ${unpointed} רשומות לא מנוקדות ממתינות ל-chatifai`);
  if (blank.length) {
    console.log(`\n❓ בלי פירוש — צריך ממך מילה:`);
    for (const b of blank) console.log(`   ${b.heard}${b.query ? `  (${b.query})` : ""}`);
  }
  if (queries.length) {
    console.log(`\n❓ שאלות עליך, לא על chatifai:`);
    for (const q of queries) console.log(`   ${q.heard} — ${q.query}`);
  }

  if (!APPLY) { console.log("\ndry run — הוסף --apply כדי לכתוב"); return; }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  let lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id;
  if (!lessonId) {
    const { data, error } = await sb.from("lessons").insert({ title: LESSON }).select("id").single();
    if (error) throw error;
    lessonId = data.id;
    console.log(`נוצר שיעור "${LESSON}"`);
  }

  for (const r of toAdd) {
    const { data, error } = await sb.from("cards").insert({
      translit_nikud: r.translit,
      arabic_script: null,
      hebrew_meaning: r.he,
      notes: r.note,
      item_type: r.item_type,
      lesson_id: lessonId,
      course_verified: true,
    }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים, כולם עם card_srs`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
