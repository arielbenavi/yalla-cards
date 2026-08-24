// Inserts the מפגש 7–8 oral notes, once each one has a pointing.
//
// A word gets its pointing from one of two places, never from a guess:
//   • the book, when the cross-reference in meeting-8-oral.ts found it there
//   • chatifai, for the rest — asked for nikud and Arabic script ONLY
//
// Items in HELD are not written. chatifai answered about a different word and
// kept doing so after being pushed back, so what the lesson said stands and the
// item waits for Dror. Substituting chatifai's word would be letting it overrule
// the course, which is exactly the thing the rule forbids.
//
//   npx tsx scripts/insert-meeting-8-oral.ts          # dry run
//   npx tsx scripts/insert-meeting-8-oral.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { ALL_ORAL_8, SUPERLATIVE_RULE } from "./data/meeting-8-oral";
import { POINTED, HELD, CHATIFAI_NOTES } from "./data/meeting-8-pointed";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 8";

/** Base letters only — Ariel writes unpointed, the database is pointed, and
 *  final forms differ. Anything less has produced a wrong count three times. */
const fold = (s: string) =>
  s.normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ًٌٍَُِّْٰ]/g, "")
    .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ")
    .replace(/[()'"׳״؟?!.,\/]/g, "")
    .replace(/\s+/g, " ")
    .trim();

type Ready = { heard: string; translit: string; ar: string | null; he: string; note: string | null };

async function main() {
  const byHeard = new Map(POINTED.map((p) => [p.heard, p]));
  const held = new Set(HELD.map((h) => h.heard));

  const ready: Ready[] = [];
  const waiting: string[] = [];
  const needAriel: string[] = [];

  for (const item of ALL_ORAL_8) {
    if (held.has(item.heard)) continue;
    if (item.needsAriel) { needAriel.push(`${item.heard} — ${item.he || "(בלי פירוש)"}`); continue; }
    if (!item.he?.trim()) { needAriel.push(`${item.heard} — (בלי פירוש)`); continue; }

    // The book first. It is the course's own pointing, and the course outranks
    // chatifai on anything that came out of a lesson.
    if (item.book) {
      ready.push({
        heard: item.heard,
        translit: item.book,
        ar: null,
        he: item.he,
        note: [item.note, "ניקוד מהספר, מפגש 8"].filter(Boolean).join(" · "),
      });
      continue;
    }

    const p = byHeard.get(item.heard);
    if (!p) { waiting.push(`${item.heard} — ${item.he}`); continue; }
    ready.push({
      heard: item.heard,
      translit: p.translit,
      ar: p.ar,
      he: item.he,
      note: [item.note, p.divergence ? `chatifai: ${p.divergence}` : null].filter(Boolean).join(" · ") || null,
    });
  }

  console.log(
    `${ALL_ORAL_8.length} רשומות · ${ready.length} מוכנות · ${held.size} מוחזקות · ` +
      `${needAriel.length} צריכות את אריאל · ${waiting.length} בלי ניקוד\n`
  );

  if (waiting.length) {
    console.log("⏸ בלי ניקוד:");
    for (const w of waiting) console.log(`   ${w}`);
    console.log();
  }
  console.log("⛔ מוחזקות — chatifai ענה על מילה אחרת:");
  for (const h of HELD) console.log(`   ${h.heard} (${h.he})`);
  console.log("\n❓ צריך את אריאל:");
  for (const n of needAriel) console.log(`   ${n}`);
  console.log();

  const rows = ready.map((r) => {
    const translit = normalizeMarks(r.translit);
    // assertClean wants an Arabic column; book-pointed rows have none, so they
    // are checked for script purity only.
    if (r.ar) assertClean(r.he, translit, r.ar);
    else if (/[ء-ي]/.test(translit)) throw new Error(`${r.heard}: ערבית בשדה התעתיק`);
    return { ...r, translit, note: r.note ? normalizeMarks(r.note) : null };
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
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(30)} ${(r.ar ?? "—").padEnd(20)} ${r.he}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id;
  if (!lessonId) throw new Error(`לא נמצא שיעור "${LESSON}"`);

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note,
        item_type: r.heard.trim().includes(" ") ? "phrase" : "word",
        lesson_id: lessonId,
        course_verified: true,
        chatifai_verified: Boolean(r.ar),
        course_note: r.ar ? "מפגש 7–8 בעל פה · ניקוד מ-chatifai" : "מפגש 7–8 בעל פה · ניקוד מהספר",
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }

  // The superlative rule as a reference table rather than eight cards — it is
  // one pattern, and four cards saying "הכי X" would drill the examples instead.
  const { data: existing } = await sb.from("paradigms").select("slug").eq("meeting", 8);
  if (!(existing ?? []).some((p) => p.slug === "superlative_afal")) {
    const { error } = await sb.from("paradigms").insert({
      meeting: 8,
      slug: "superlative_afal",
      data: {
        title: "דרגת ההפלגה — משקל אַפְעַל",
        description: SUPERLATIVE_RULE.rule,
        course_verified: true,
        rows: SUPERLATIVE_RULE.examples.map((e) => ({ person: e.he, base: e.base, superlative: e.superlative })),
      },
    });
    if (error) throw error;
    console.log("נוספה טבלת superlative_afal");
  }

  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים, הכל עם card_srs`);
  console.log(`\nהערות ש-chatifai הוסיף מיוזמתו (${CHATIFAI_NOTES.length}) נשמרו ב-meeting-8-pointed.ts`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
