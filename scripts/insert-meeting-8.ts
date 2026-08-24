// Inserts מפגש 8 — the book material only (עמ' 117–131).
//
// The book arrives pointed, so nothing here waits on chatifai. Ariel's own oral
// notes (scripts/data/meeting-8-oral.ts) are unpointed and go through a separate
// chatifai pass — and only for the items the book does not already point, which
// the cross-reference in that file works out.
//
//   npx tsx scripts/insert-meeting-8.ts          # dry run
//   npx tsx scripts/insert-meeting-8.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";
import {
  QUESTION_WORDS,
  PRACTICE_QUESTIONS,
  INDIRECT_L,
  WASAF_POS_NEG,
  DAFA_GRID,
  SARIQ_PARTICIPLE,
  DIALOGUE_8,
  VOCAB_8,
} from "./data/meeting-8-book";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 8";
const MEETING = 8;

const strip = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "")
   .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ")
   .replace(/[؟?!.,]/g, "").replace(/\s+/g, " ").trim();

const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;

/** Same guard as מפגש 6: the book gives no Arabic column, but the Hebrew
 *  transliteration must stay pure Hebrew with no leftover Arabic diacritic. */
function assertHebrewOnly(label: string, translit: string): void {
  if (ARABIC_LETTER.test(translit)) throw new Error(`${label}: ערבית בשדה התעתיק — ${translit}`);
  if (ARABIC_MARK.test(translit)) throw new Error(`${label}: סימן ערבי בתעתיק העברי — ${translit}`);
}

function normalizeDeep<T>(value: T): T {
  if (typeof value === "string") return normalizeMarks(value) as unknown as T;
  if (Array.isArray(value)) return value.map(normalizeDeep) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalizeDeep(v)])
    ) as T;
  }
  return value;
}

type CardRow = { translit: string; he: string; note?: string | null; plural?: string | null; item_type: "word" | "phrase" | "sentence" };

function paradigms() {
  return [
    { slug: INDIRECT_L.slug, data: INDIRECT_L },
    { slug: WASAF_POS_NEG.slug, data: WASAF_POS_NEG },
    { slug: DAFA_GRID.slug, data: DAFA_GRID },
    { slug: SARIQ_PARTICIPLE.slug, data: SARIQ_PARTICIPLE },
    {
      slug: "question_words",
      data: {
        title: "מליות ומשפטי שאלה (עמ' 117–119)",
        words: QUESTION_WORDS,
      },
    },
    {
      slug: "question_practice",
      data: {
        title: "תרגול משפטי שאלה (עמ' 120–121)",
        type: "translation_exercise",
        note: "הפתרון מעמ' 121 שמור לצד כל משפט",
        sentences: PRACTICE_QUESTIONS,
      },
    },
    {
      slug: "simulation_meeting8_intro",
      data: {
        title: "דו-שיח מפגש 8 — היכרות",
        description: "דו-שיח היכרות מהספר, מפגש 8 (עמ' 127–128)",
        // Book material, not machine-generated. The simulate screen serves only
        // chatifai_verified dialogues because the AI-written ones needed review;
        // this one came pointed from the course, so it is marked course_verified.
        course_verified: true,
        chatifai_verified: false,
        turns: DIALOGUE_8.map((t) => ({
          speaker: t.speaker === "a" ? "other" : "user",
          translit: t.translit,
          he: t.he,
        })),
      },
    },
  ];
}

function cards(): CardRow[] {
  const out: CardRow[] = [];

  // The 74-item vocabulary list.
  for (const w of VOCAB_8) {
    out.push({
      translit: w.translit,
      he: w.he,
      plural: w.plural ?? null,
      note: [w.plural ? `ריבוי: ${w.plural}` : null, w.note ?? null].filter(Boolean).join(" · ") || null,
      item_type: "word",
    });
  }

  // The question words themselves, plus every example the book gives for them.
  // The examples are the point: "בְּאֵיש" on its own is a slot, and it is the
  // sentence that shows what goes in it.
  for (const q of QUESTION_WORDS) {
    out.push({
      translit: q.translit,
      he: q.he,
      note: q.note ?? null,
      item_type: "word",
    });
    for (const ex of q.examples ?? []) {
      out.push({ translit: ex.translit, he: ex.he, item_type: "phrase" });
    }
  }

  return out;
}

async function main() {
  const rows = cards().map((r) => normalizeDeep(r));
  for (const r of rows) {
    assertHebrewOnly(r.he, r.translit);
    if (r.note) assertHebrewOnly(r.he, r.note);
    if (!r.he?.trim()) throw new Error(`אין פירוש עברי: ${r.translit}`);
  }

  // The grid is the reason this lesson matters, so it gets checked rather than
  // trusted: 8 objects × 8 subjects, every cell either a form or a blocked X.
  const subjects = DAFA_GRID.subjects.map((s) => s.person);
  const KEY: Record<string, string> = {
    "אַנַא": "ana", "אִנְתֵ": "inta", "אִנְתִי": "inti", "הֻוֵّ": "huwwe",
    "הִיֵّ": "hiyye", "אִחְנַא": "ihna", "אִנְתוּ": "intu", "הֵםّ": "hum",
  };
  if (DAFA_GRID.rows.length !== 8) throw new Error(`טבלת דַפַע: ${DAFA_GRID.rows.length} שורות במקום 8`);
  for (const row of DAFA_GRID.rows) {
    for (const s of subjects) {
      const k = KEY[s];
      const cell = (row as unknown as Record<string, string>)[k];
      if (!cell) throw new Error(`טבלת דַפַע: תא חסר — ${row.person} × ${s}`);
      if (cell !== "X") assertHebrewOnly(`${row.person} × ${s}`, normalizeMarks(cell));
    }
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

  const { data: existing } = await sb.from("paradigms").select("slug").eq("meeting", MEETING);
  const haveSlugs = new Set((existing ?? []).map((p) => p.slug));
  const newParadigms = paradigms()
    .filter((p) => !haveSlugs.has(p.slug))
    .map((p) => ({ slug: p.slug, data: normalizeDeep(p.data) }));

  console.log(
    `כרטיסים: ${rows.length} · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n` +
      `טבלאות: ${paradigms().length} · ${newParadigms.length} להוספה\n`
  );
  for (const r of toAdd) console.log(`  [${r.item_type}] ${r.translit.padEnd(30)} ${r.he}`);
  console.log();
  for (const p of newParadigms) console.log(`  [paradigm] ${p.slug}`);
  console.log(`\n✔ טבלת דַפַע נבדקה: 8 כינויי מושא × 8 גופים, כל התאים מלאים`);

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

  for (const p of newParadigms) {
    const { error } = await sb.from("paradigms").insert({ meeting: MEETING, slug: p.slug, data: p.data });
    if (error) throw error;
  }

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: null,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        plural_form: r.plural ?? null,
        item_type: r.item_type,
        lesson_id: lessonId,
        course_verified: true,
        course_note: "מפגש 8 — ספר, מנוקד במקור",
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }

  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים ו-${newParadigms.length} טבלאות, הכל עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
