// Inserts מפגש 6 — the book material only.
//
// The book is already pointed, so nothing here waits on chatifai. Ariel's own
// oral-lesson words (scripts/data/meeting-6.ts) are unpointed and DO wait on it,
// under the rule added 2026-08-11 — they are handled by a separate script once
// the pointing comes back.
//
// The two object-suffix grids are held: `OBJECT_SUFFIX_GRIDS.verified` is false
// and this script refuses to write them. That is deliberate, see the comment on
// the constant.
//
//   npx tsx scripts/insert-meeting-6.ts          # dry run
//   npx tsx scripts/insert-meeting-6.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";
import {
  PAST_TENSE,
  PARTICIPLES,
  MOTION_PARTICIPLES,
  SENSE_PARTICIPLES,
  DUAL_USE_VERBS,
  TIME_WORDS,
  DAY_PARTS,
  WEEKDAYS,
  RELATIVE_DAYS,
  PRACTICE_SENTENCES,
  TRANSLATION_SENTENCES,
  OBJECT_SUFFIX_GRIDS,
} from "./data/meeting-6-book";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 6";
const MEETING = 6;

const strip = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "").replace(/\s+/g, " ").trim();

const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;

/**
 * The book gives no Arabic script — its pages are Hebrew transliteration only —
 * so `assertClean` from lib/normalize-marks is the wrong guard here: it requires
 * an Arabic column. What still has to hold is that the transliteration is pure
 * Hebrew and carries no leftover Arabic diacritic, which is the defect that got
 * through twice before.
 */
function assertHebrewOnly(label: string, translit: string): void {
  if (ARABIC_LETTER.test(translit)) throw new Error(`${label}: ערבית בשדה התעתיק — ${translit}`);
  if (ARABIC_MARK.test(translit)) throw new Error(`${label}: סימן ערבי בתעתיק העברי — ${translit}`);
}

/** Runs every string in a nested payload through normalizeMarks. */
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

type CardRow = {
  translit: string;
  he: string;
  ar?: string | null;
  note?: string | null;
  item_type: "word" | "sentence";
};

/** Every paradigm this script writes, as (slug, payload) pairs. */
function paradigms() {
  return [
    { slug: PAST_TENSE.slug, data: { title: PAST_TENSE.title, note: PAST_TENSE.note, columns: PAST_TENSE.columns, rows: PAST_TENSE.rows } },
    { slug: PARTICIPLES.slug, data: PARTICIPLES },
    { slug: MOTION_PARTICIPLES.slug, data: MOTION_PARTICIPLES },
    { slug: SENSE_PARTICIPLES.slug, data: SENSE_PARTICIPLES },
    { slug: DUAL_USE_VERBS.slug, data: DUAL_USE_VERBS },
    { slug: WEEKDAYS.slug, data: WEEKDAYS },
    {
      slug: "practice_sentences_past",
      data: {
        title: "משפטים לתרגול — הפועל בעבר",
        type: "reading_exercise",
        note: "הספר לא נותן תרגום למשפטים האלה — הם תרגיל קריאה ופענוח, ולכן לא הומצא תרגום",
        sentences: PRACTICE_SENTENCES.map((translit, i) => ({ num: i + 1, translit })),
      },
    },
    {
      slug: "translation_sentences",
      data: {
        title: "משפטים לתרגום — הפועל בעבר + כינויי מושא",
        type: "translation_exercise",
        note: "הספר לא נותן את הערבית — זה התרגיל. התשובות של אריאל הן שממלאות אותן",
        sentences: TRANSLATION_SENTENCES.map((hebrew, i) => ({ num: i + 1, hebrew })),
      },
    },
  ];
}

/** Vocabulary cards: times, parts of the day, relative days, weekdays. */
function cards(): CardRow[] {
  const out: CardRow[] = [];

  for (const w of [...TIME_WORDS, ...DAY_PARTS]) {
    out.push({
      translit: w.translit,
      he: w.he,
      note: [
        w.plural ? `ריבוי: ${w.plural}${w.plural_he ? ` (${w.plural_he})` : ""}` : null,
        (w as { note?: string }).note ?? null,
      ]
        .filter(Boolean)
        .join(" · ") || null,
      item_type: "word",
    });
  }

  for (const d of RELATIVE_DAYS) {
    out.push({ translit: d.translit, he: d.he, item_type: "word" });
  }

  // The weekday goes on the card in its full form, with the short form in the
  // note — the short form is what he will actually hear, but the full form is
  // what makes the pattern visible.
  for (const d of WEEKDAYS.rows) {
    out.push({
      translit: d.full,
      he: d.he,
      note: `בצורה מקוצרת: ${d.short}`,
      item_type: "word",
    });
  }

  // Participles as cards, since these are the forms that carry present tense.
  for (const p of [PARTICIPLES.active, PARTICIPLES.passive]) {
    out.push({
      translit: p.singular.form,
      he: p.singular.he,
      note: `${p.feminine.form} (${p.feminine.he}) · ${p.plural.form} (${p.plural.he}) · שלילה: מֶש / מִש`,
      item_type: "word",
    });
  }

  for (const r of DUAL_USE_VERBS.rows) {
    out.push({
      translit: r.participle,
      he: r.participle_he,
      note: `פועל דו-שימושי · עבר: ${r.past} (${r.past_he})`,
      item_type: "word",
    });
  }

  return out;
}

async function main() {
  if (OBJECT_SUFFIX_GRIDS.verified) {
    throw new Error(
      "OBJECT_SUFFIX_GRIDS.verified הוא true אבל אין בו תאים — צריך למלא את הטבלאות לפני שמסירים את הדגל"
    );
  }

  const rows = cards().map((r) => normalizeDeep(r));
  for (const r of rows) {
    assertHebrewOnly(r.he, r.translit);
    if (r.note) assertHebrewOnly(r.he, r.note);
    if (!r.he?.trim()) throw new Error(`אין פירוש עברי: ${r.translit}`);
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
  for (const r of toAdd) console.log(`  [${r.item_type}] ${r.translit.padEnd(24)} ${r.he}`);
  console.log();
  for (const p of newParadigms) console.log(`  [paradigm] ${p.slug}`);
  console.log(
    `\n⏸ טבלאות כינויי המושא (פַחַצ, מִסֵכּ) מוחזקות — 128 תאים מנוקדים שלא ניתן לקרוא בביטחון מהצילום`
  );

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
    const { error } = await sb
      .from("paradigms")
      .insert({ meeting: MEETING, slug: p.slug, data: p.data });
    if (error) throw error;
  }

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar ?? null,
        hebrew_meaning: r.he,
        notes: r.note ?? null,
        item_type: r.item_type,
        lesson_id: lessonId,
        course_verified: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb
      .from("card_srs")
      .insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }

  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים ו-${newParadigms.length} טבלאות, הכל עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
