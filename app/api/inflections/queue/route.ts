import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  // Overdue rows: state=0 (New, due=now by default) or past-due reviews
  const { data: rows, error } = await supabase
    .from("conjugation_srs")
    .select("*, verb:verb_conjugations(id, root, root_translit, meaning_he, forms, forms_full)")
    .lte("due", now)
    .order("due", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // All verbs needed for distractor generation client-side
  const { data: allVerbs, error: verbsError } = await supabase
    .from("verb_conjugations")
    .select("id, root, root_translit, meaning_he, forms, forms_full");

  if (verbsError) return NextResponse.json({ error: verbsError.message }, { status: 500 });

  // The screen shows one form per person. `forms` is Arabic script only, which
  // is unreadable for a learner who works in transliteration, so surface the
  // vocalised Hebrew from forms_full.present where a verb has it.
  type Cell = { translit?: string; arabic?: string };
  function translitForms(verb: { forms_full?: unknown }): Record<string, string> {
    const present = (verb?.forms_full as { present?: Record<string, Cell> })?.present;
    if (!present) return {};
    const out: Record<string, string> = {};
    for (const [person, cell] of Object.entries(present)) {
      if (cell?.translit) out[person] = cell.translit;
    }
    return out;
  }

  const items = (rows ?? []).map((row) => {
    const verb = Array.isArray(row.verb) ? row.verb[0] : row.verb;
    return {
      srs_id: row.id,
      verb_id: row.verb_id,
      track: row.track as "recognition" | "production" | "audio",
      root: verb?.root ?? "",
      root_translit: verb?.root_translit ?? null,
      meaning_he: verb?.meaning_he ?? "",
      forms: (verb?.forms ?? {}) as Record<string, string>,
      forms_translit: translitForms(verb ?? {}),
    };
  });

  const verbsOut = (allVerbs ?? []).map((v) => ({
    id: v.id,
    root: v.root,
    root_translit: v.root_translit ?? null,
    meaning_he: v.meaning_he,
    forms: (v.forms ?? {}) as Record<string, string>,
    forms_translit: translitForms(v),
  }));

  return NextResponse.json({ items, all_verbs: verbsOut });
}
