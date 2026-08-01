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

export type DrillSet = {
  id: string;
  source: "verb" | "paradigm";
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
        title: `${v.root_translit ?? v.root} — ${TENSE_LABEL[tense]}`,
        subtitle: v.meaning_he,
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
      const SKIP_COLS = new Set(["ar", "arabic", "arabic_script", "variant", "note"]);
      const columns = Object.keys(data.rows[0]).filter(
        (k) => k !== "person" && !SKIP_COLS.has(k)
      );
      for (const col of columns) {
        const slots = data.rows
          .filter((r) => r.person && r[col])
          .map((r) => ({ person: r.person, answer: primaryForm(r[col]) }));
        if (slots.length < 3) continue;
        sets.push({
          id: `paradigm:${p.id}:${col}`,
          source: "paradigm",
          title: data.translations?.[col]
            ? `${col} — ${data.translations[col]}`
            : columns.length === 1
            // Single-column paradigm: the column name adds nothing
            ? (data.description?.split(/[—.]/)[0].trim() || p.slug)
            : `${p.slug} — ${col}`,
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
        title: `תַבַּע — ${gender === "masculine" ? "שם עצם זכר" : "שם עצם נקבה"}`,
        subtitle: block.example ?? data.description ?? null,
        slots,
      });
    }
  }

  return NextResponse.json({ sets, total: sets.length });
}
