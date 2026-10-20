// Inserts Ariel's own מפגש 6 notes (what Tomer said out loud) once their
// pointing is in meeting-6-notes-pointed.ts. Same contract as insert-oral-4.ts:
// the lesson says what the words are and what they mean, chatifai only points
// them, and nothing without a pointing goes in.
//
//   npx tsx scripts/insert-meeting-6-notes.ts          # dry run
//   npx tsx scripts/insert-meeting-6-notes.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { NOTES_TIME, NOTES_DAYS, NOTES_VOCAB, NOTES_PHRASES } from "./data/meeting-6";
import { POINTED_6 } from "./data/meeting-6-notes-pointed";
const ALL = [...NOTES_TIME, ...NOTES_DAYS, ...NOTES_VOCAB, ...NOTES_PHRASES].map((v) => ({ heard: v.translit, he: v.he, note: [v.note, v.plural && `רבים: ${v.plural}`].filter(Boolean).join(" · ") || undefined }));
const POINTED: Record<string, { translit: string; ar: string; he?: string; chatifaiNote?: string }> = POINTED_6;
const HELD: { heard: string; first: string; insisted: string }[] = [];

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 6";

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
  const ready = ALL.filter((e) => POINTED[e.heard]);
  const waiting = ALL.filter((e) => !POINTED[e.heard]);
  console.log(`${ALL.length} רשומות · ${ready.length} מנוקדות · ${waiting.length} לא מוכנסות\n`);
  if (HELD.length) {
    console.log("⏸ מחכות להכרעה של אריאל:");
    for (const h of HELD) console.log(`   ${h.heard.padEnd(18)} 1: ${h.first}   2: ${h.insisted}`);
    console.log();
  }

  const rows = ready.map((e) => {
    const p = POINTED[e.heard];
    const translit = normalizeMarks(p.translit);
    const he = p.he ?? e.he;
    assertClean(he, translit, p.ar);
    return { heard: e.heard, translit, ar: p.ar, he, note: e.note, courseNote: p.chatifaiNote ?? null };
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

  const { data: lesson, error: le } = await sb.from("lessons").select("id").eq("title", LESSON).single();
  if (le) throw le;

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        item_type: r.heard.includes(" ") ? "sentence" : "word",
        lesson_id: lesson.id,
        course_verified: true,
        course_note: r.courseNote,
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
