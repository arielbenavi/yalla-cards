// Inserts מפגש בעפ 4 once the pointing is in meeting-oral-4-pointed.ts.
//
// The lesson is the authority on *what* the words are and *what they mean*;
// chatifai supplies only how to point them and how to write them in Arabic.
// So this script will not invent a pointing, and it will not fall back to
// inserting Ariel's unpointed spelling as if it were a transliteration — an
// unpointed card teaches the wrong vowels by omission, which is worse than a
// missing card.
//
// Everything written here gets `course_verified = true`. `chatifai_verified`
// stays false: chatifai was never asked to verify these, only to point them, and
// the two columns disagreeing is information rather than a defect.
//
//   npx tsx scripts/insert-oral-4.ts          # dry run
//   npx tsx scripts/insert-oral-4.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { ALL_ORAL_4 } from "./data/meeting-oral-4";
import {
  POINTED,
  NEEDS_GLOSS_FROM_ARIEL,
  EXISTING_CARDS_TO_ANNOTATE,
} from "./data/meeting-oral-4-pointed";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש בעל פה 4";

/** Base letters only. Ariel writes unpointed, the database is pointed, and final
 *  forms differ — anything less than this folds badly and the count lies. That
 *  has produced three wrong counts on this project already. */
const fold = (s: string) =>
  s
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ًٌٍَُِّْٰ]/g, "")
    .replace(/ך/g, "כ")
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ף/g, "פ")
    .replace(/ץ/g, "צ")
    .replace(/[()'"׳״]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function main() {
  const glossed = ALL_ORAL_4.filter((e) => e.he.trim());
  const ready = glossed.filter((e) => POINTED[e.heard]);
  const waiting = glossed.filter((e) => !POINTED[e.heard]);

  console.log(
    `${ALL_ORAL_4.length} רשומות · ${ready.length} מנוקדות ומוכנות · ` +
      `${waiting.length} ממתינות לניקוד · ${NEEDS_GLOSS_FROM_ARIEL.length} בלי פירוש\n`
  );

  if (waiting.length) {
    console.log("⏸ ממתינות לפאס של chatifai (ניקוד + ערבית בלבד):");
    for (const e of waiting) console.log(`   ${e.heard.padEnd(34)} ${e.he}`);
    console.log();
  }
  if (NEEDS_GLOSS_FROM_ARIEL.length) {
    console.log("❓ אריאל השאיר בלי פירוש — צריך ממנו מילה:");
    for (const h of NEEDS_GLOSS_FROM_ARIEL) console.log(`   ${h}`);
    console.log();
  }
  console.log("📝 קיימות כבר, מקבלות הערת קורס במקום כרטיס כפול:");
  for (const a of EXISTING_CARDS_TO_ANNOTATE) console.log(`   ${a.heard} → ${a.courseNote}`);
  console.log();

  if (!ready.length) {
    console.log("אין מה להכניס עדיין — מלא את POINTED ב-meeting-oral-4-pointed.ts");
    return;
  }

  const rows = ready.map((e) => {
    const p = POINTED[e.heard];
    const translit = normalizeMarks(p.translit);
    assertClean(e.he, translit, p.ar);
    return { heard: e.heard, translit, ar: p.ar, he: e.he, note: e.note, chatifaiNote: p.chatifaiNote };
  });

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.add(fold(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const seen = new Set<string>();
  const toAdd = rows.filter((r) => {
    const k = fold(r.translit);
    if (known.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`${rows.length} מנוקדות · ${rows.length - toAdd.length} כבר קיימות · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(26)} ${r.ar.padEnd(16)} ${r.he}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  let lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id;
  if (!lessonId) {
    const { data, error } = await sb.from("lessons").insert({ title: LESSON }).select("id").single();
    if (error) throw error;
    lessonId = data.id;
    console.log(`נוצר שיעור "${LESSON}"`);
  }

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        item_type: r.heard.includes(" ") ? "sentence" : "word",
        lesson_id: lessonId,
        course_verified: true,
        course_note: r.chatifaiNote ? `chatifai הוסיף מיוזמתו: ${r.chatifaiNote}` : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }

  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים ל"${LESSON}", כולם עם card_srs ו-course_verified`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
