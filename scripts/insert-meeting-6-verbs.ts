// The six verbs from המשך תרגול הטיות, as vocabulary cards.
//
// Their full conjugations are blocked on chatifai (the Chrome extension was not
// connected on 2026-08-11), but the stem and the gloss are printed on the page
// and pointed, so there is no reason to hold the cards hostage to the paradigm.
// A card he can review today beats a complete table he gets next week.
//
// The משקל goes in `notes` rather than being dropped: פַעַל versus פִעֵל is the
// whole point of the מפגש 6 past-tense lesson, and it is what predicts the stem
// vowel in every cell of the table he has yet to fill in.
//
// Arabic script is null on purpose — the book gives none and this script does
// not invent any. It arrives with the conjugation pass.
//
//   npx tsx scripts/insert-meeting-6-verbs.ts          # dry run
//   npx tsx scripts/insert-meeting-6-verbs.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";
import { MEETING_6_VERBS, CONJUGATIONS } from "./data/meeting-6-verbs";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 6";
const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;

const fold = (s: string) =>
  s
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ًٌٍَُِّْٰ]/g, "")
    .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ")
    .replace(/ף/g, "פ").replace(/ץ/g, "צ")
    .replace(/[()'"׳״]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function main() {
  const rows = MEETING_6_VERBS.map((v) => ({ ...v, translit: normalizeMarks(v.translit) }));
  for (const r of rows) {
    if (ARABIC_LETTER.test(r.translit)) throw new Error(`ערבית בתעתיק: ${r.translit}`);
    if (ARABIC_MARK.test(r.translit)) throw new Error(`סימן ערבי בתעתיק: ${r.translit}`);
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
  const pending = rows.filter((r) => !CONJUGATIONS[r.translit]);

  console.log(`${rows.length} פעלים · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(14)} ${r.he.padEnd(10)} משקל ${r.pattern}`);
  console.log(`\n⏸ ${pending.length} נטיות מלאות ממתינות ל-chatifai (עבר/הווה/ציווי/בינוני)`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id ?? null;

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: null,
        hebrew_meaning: r.he,
        notes: `פועל — משקל ${r.pattern} · מהמשך תרגול ההטיות של מפגש 6`,
        item_type: "word",
        lesson_id: lessonId,
        course_verified: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים, כולם עם card_srs`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
