import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  // Overdue rows: state=0 (New, due=now by default) or past-due reviews
  const { data: rows, error } = await supabase
    .from("conjugation_srs")
    .select("*, verb:verb_conjugations(id, root, meaning_he, forms)")
    .lte("due", now)
    .order("due", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // All verbs needed for distractor generation client-side
  const { data: allVerbs, error: verbsError } = await supabase
    .from("verb_conjugations")
    .select("id, root, meaning_he, forms");

  if (verbsError) return NextResponse.json({ error: verbsError.message }, { status: 500 });

  const items = (rows ?? []).map((row) => {
    const verb = Array.isArray(row.verb) ? row.verb[0] : row.verb;
    return {
      srs_id: row.id,
      verb_id: row.verb_id,
      track: row.track as "recognition" | "production" | "audio",
      root: verb?.root ?? "",
      meaning_he: verb?.meaning_he ?? "",
      forms: (verb?.forms ?? {}) as Record<string, string>,
    };
  });

  return NextResponse.json({ items, all_verbs: allVerbs ?? [] });
}
