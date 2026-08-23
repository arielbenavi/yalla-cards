import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Drag-the-inflection-into-its-box drill (task #4).
 *
 *  Verbs and grammar paradigms are stored differently — verb_conjugations has
 *  forms_full keyed by tense then person, paradigms has rows keyed by person
 *  with one column per preposition — but both are "one form per person", so
 *  they normalise to the same drill shape.
 *
 *  Only chatifai-verified sources are served, same rule as the dialogues.
 */

const PERSON_LABEL: Record<string, string> = {
  ana: "אנא",
  inta: "אנת",
  inti: "אנתי",
  huwwe: "הו",
  hiyye: "הי",
  ihna: "אחנא",
  intu: "אנתו",
  hum: "הם",
};

const TENSE_LABEL: Record<string, string> = {
  past: "עבר",
  present: "הווה",
  imperative: "ציווי",
};

/**
 * Hebrew names for the paradigm slugs (note 7a063a00 / e165eccf).
 *
 * The title used to fall back to the raw slug, so the drill announced itself as
 * "possession_maa — positive" and never said what was being inflected. Ariel's
 * ask was blunt: say what the word means. A slug missing from this map still
 * falls back to itself, so adding a paradigm never breaks the screen — it just
 * shows an untranslated name until someone adds the line.
 */
const SLUG_LABEL: Record<string, string> = {
  prepositions: "מילות יחס",
  akh_inflection: "אַח' — אח",
  ab_akh_inflection: "אַבּ / אַח' — אב ואח",
  possessives: "שייכות",
  possessive_tabaa: "שייכות — תַבַּע",
  possession_tabaa: "שייכות — תַבַּע / תַע",
  possession_ili: "אִלִי — יש לי",
  possession_ind: "עִנְד — יש ל… / אצל",
  possession_maa: "מַע — איתי, עליי",
  demonstratives: "כינויי רמז",
  colours: "צבעים",
  ordinals: "מספרים סודרים",
  weekdays: "ימות השבוע",
  past_sound_verb: "עבר — פועל שלם",
  dual_use_verbs: "פעלים דו-שימושיים",
};

/** Hebrew names for paradigm columns that carry no `translations` block. */
const COLUMN_LABEL: Record<string, string> = {
  positive: "חיוב",
  negative: "שלילה",
  m: "זכר",
  f: "נקבה",
  pl: "רבים",
  form: "צורה",
  past: "עבר",
  participle: "בינוני",
  faal: "משקל פַעַל",
  fiel: "משקל פִעֵל",
  full: "צורה מלאה",
  short: "צורה מקוצרת",
  translit: "תעתיק",
};

const labelFor = (slug: string) => SLUG_LABEL[slug] ?? slug;
const columnLabel = (col: string) => COLUMN_LABEL[col] ?? col;

export type DrillSet = {
  id: string;
  source: "verb" | "paradigm";
  /**
   * Topic heading the drill belongs under (note 17f19ad7).
   *
   * The screen used to list 66 flat entries, one per verb per tense, which made
   * choosing what to practise a chore in itself — "אין צורך לפרק פר פועל / כל
   * פיפס קטן". Grouping by meeting for paradigms and by tense for verbs turns
   * that into a handful of topics, each holding several drills to run in a row.
   */
  group: string;
  title: string;
  subtitle: string | null;
  slots: { person: string; answer: string }[];
};

type Cell = { translit?: string; arabic?: string };

/** A drill token should be one clean form. Some paradigm cells carry a variant
 *  or an Arabic gloss in parentheses — "עַלַיּ (עַלַيَّ)" — which is useful on a
 *  reference table but unusable as something you drag into a box. */
function primaryForm(s: string): string {
  return s.replace(/\s*\([^)]*\)/g, "").trim();
}

export async function GET() {
  const supabase = supabaseAdmin();

  const [{ data: verbs }, { data: paradigms }] = await Promise.all([
    supabase
      .from("verb_conjugations")
      .select("id, root, root_translit, meaning_he, forms_full, chatifai_verified")
      .eq("chatifai_verified", true),
    supabase.from("paradigms").select("id, meeting, slug, data"),
  ]);

  const sets: DrillSet[] = [];

  for (const v of verbs ?? []) {
    const full = v.forms_full as Record<string, Record<string, Cell>> | null;
    if (!full) continue;
    for (const tense of ["past", "present", "imperative"] as const) {
      const table = full[tense];
      if (!table) continue;
      const slots = Object.entries(table)
        .filter(([person, cell]) => PERSON_LABEL[person] && cell?.translit)
        .map(([person, cell]) => ({ person: PERSON_LABEL[person], answer: primaryForm(cell.translit!) }));
      // Two slots is not a drill
      if (slots.length < 3) continue;
      sets.push({
        id: `verb:${v.id}:${tense}`,
        source: "verb",
        group: `פעלים — ${TENSE_LABEL[tense]}`,
        // The meaning goes in the title, not the subtitle. Drilling a paradigm
        // for a verb you cannot translate is drilling a shape.
        title: `${v.root_translit ?? v.root} — ${v.meaning_he}`,
        subtitle: TENSE_LABEL[tense],
        slots,
      });
    }
  }

  for (const p of paradigms ?? []) {
    const data = p.data as {
      rows?: Record<string, string>[];
      description?: string;
      chatifai_verified?: boolean;
      translations?: Record<string, string>;
      masculine?: { rows?: Record<string, string>[]; example?: string };
      feminine?: { rows?: Record<string, string>[]; example?: string };
    };

    // rows: [{person, fi, min, ala, an}] — one drill per column
    if (Array.isArray(data?.rows) && data.rows.length >= 3) {
      // Skip Arabic-script columns: the learner reads transliteration, so a
      // drill that asks them to place عني in a box tests nothing they know yet.
      // Skip Arabic script, and skip "variant" columns: an alternate form is a
      // note on the main answer, not a paradigm of its own to drill.
      // Match the suffix too, not just the exact name: the colours paradigm
      // carries m_ar / f_ar / pl_ar alongside its transliteration columns, and
      // an exact-match list would have turned each of those into a drill that
      // asks the learner to place أحمر in a box.
      // `_alt` for the same reason as `variant`: the מפגש 6 past table gives
      // כַּתַבֵּת beside כַּתַבְּת as the book's alternate pointing of one form, and
      // drilling it separately would teach a paradigm that does not exist.
      // `_he` is a gloss column, not a form.
      const SKIP_COLS = new Set(["ar", "arabic", "arabic_script", "variant", "note"]);
      const columns = Object.keys(data.rows[0]).filter(
        (k) =>
          k !== "person" &&
          !SKIP_COLS.has(k) &&
          !k.endsWith("_ar") &&
          !k.endsWith("_alt") &&
          !k.endsWith("_he")
      );
      for (const col of columns) {
        const slots = data.rows
          .filter((r) => r.person && r[col])
          .map((r) => ({ person: r.person, answer: primaryForm(r[col]) }));
        if (slots.length < 3) continue;
        sets.push({
          id: `paradigm:${p.id}:${col}`,
          source: "paradigm",
          group: p.meeting ? `מפגש ${p.meeting}` : "כללי",
          title: data.translations?.[col]
            ? `${labelFor(p.slug)} — ${data.translations[col]}`
            : columns.length === 1
            // Single-column paradigm: the column name adds nothing
            ? labelFor(p.slug)
            : `${labelFor(p.slug)} — ${columnLabel(col)}`,
          subtitle: data.description ?? null,
          slots,
        });
      }
    }

    // possessive_tabaa: masculine / feminine each hold their own rows
    for (const gender of ["masculine", "feminine"] as const) {
      const block = data?.[gender];
      if (!Array.isArray(block?.rows) || block.rows.length < 3) continue;
      const slots = block.rows
        .filter((r) => r.person && r.form)
        .map((r) => ({ person: r.person, answer: primaryForm(r.form) }));
      if (slots.length < 3) continue;
      sets.push({
        id: `paradigm:${p.id}:${gender}`,
        source: "paradigm",
        group: p.meeting ? `מפגש ${p.meeting}` : "כללי",
        title: `תַבַּע — ${gender === "masculine" ? "שם עצם זכר" : "שם עצם נקבה"}`,
        subtitle: block.example ?? data.description ?? null,
        slots,
      });
    }
  }

  return NextResponse.json({ sets, total: sets.length });
}
