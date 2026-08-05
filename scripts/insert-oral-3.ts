// Inserts מפגש בעפ 3 from scripts/data/meeting-oral-3-ruled.ts.
//
// Every card here is `course_verified = true` — Ariel heard these from Tomer in
// the lesson. `chatifai_verified` is set only where chatifai actually confirmed
// the lesson form. The two are independent: a card confirmed by the course and
// disputed by chatifai keeps the lesson form and records the dispute in
// `course_note`, because that disagreement is evidence, not a defect.
//
// The script refuses to write a card whose ruling is missing rather than
// inventing vocalisation for it.
//
//   npx tsx scripts/insert-oral-3.ts          # dry run
//   npx tsx scripts/insert-oral-3.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { RULED, type Ruled } from "./data/meeting-oral-3-ruled";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש בעפ 3";
const strip = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const rows: Ruled[] = RULED.map((r) => ({ ...r, translit: normalizeMarks(r.translit) }));

  for (const r of rows) {
    if (!r.translit?.trim() || !r.ar?.trim()) {
      throw new Error(`אין פסק מלא ל-"${r.heard}" — לא ממציאים ניקוד או ערבית`);
    }
    assertClean(r.heard, r.translit, r.ar);
    if (!r.he?.trim()) throw new Error(`אין פירוש עברי: ${r.heard}`);
  }

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.add(strip(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const seen = new Set<string>();
  const toAdd = rows.filter((r) => {
    const k = strip(r.translit);
    if (known.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const disputed = toAdd.filter((r) => !r.chatifai_agrees);
  console.log(
    `${rows.length} פסקים · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n` +
      `מתוכם ${disputed.length} ש-chatifai הסתייג מהם — נשמרת צורת השיעור\n`
  );
  for (const r of toAdd) {
    const mark = r.chatifai_agrees ? "✓" : "⚠";
    console.log(`  ${mark} ${r.translit.padEnd(20)} ${r.ar.padEnd(14)} ${r.he}`);
    if (!r.chatifai_agrees && r.chatifai_said) console.log(`      chatifai: ${r.chatifai_said}`);
  }

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
    console.log(`\nנוצר שיעור "${LESSON}"`);
  }

  for (const r of toAdd) {
    const courseNote = [
      r.tomer ? "מאומת תומר" : null,
      r.ariel_note,
      r.chatifai_agrees ? null : r.chatifai_said ? `chatifai הסתייג: ${r.chatifai_said}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        item_type: r.item_type ?? "word",
        lesson_id: lessonId,
        course_verified: true,
        course_note: courseNote || null,
        chatifai_verified: r.chatifai_agrees === true,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb
      .from("card_srs")
      .insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים ל"${LESSON}", כולם course_verified + card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
