import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** The deck's own proverbs and expressions, for the daily proverb: cards whose meaning or note
 *  says פתגם, plus non-word cards whose note says ביטוי. Read-only. */
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("cards")
    .select("id, item_type, arabic_script, translit_nikud, hebrew_meaning, notes")
    .or("notes.ilike.%פתגם%,hebrew_meaning.ilike.%פתגם%,notes.ilike.%ביטוי%")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data ?? [])
    .filter((c) => /פתגם/.test(`${c.notes ?? ""} ${c.hebrew_meaning}`) || c.item_type !== "word")
    .filter((c) => c.hebrew_meaning.trim() !== "פתגם היום")
    .map((c) => ({
      id: c.id,
      ar: c.arabic_script ?? "",
      tr: c.translit_nikud,
      he: c.hebrew_meaning.replace(/\s*\(פתגם\)\s*/, ""),
      note: (c.notes ?? "").replace(/^פתגם\.?\s*/, "").replace(/^ביטוי\.?\s*/, "") || undefined,
    }));
  return NextResponse.json({ items });
}
