import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { card_ids } = body as { card_ids?: string[] };

  if (!Array.isArray(card_ids) || card_ids.length === 0) {
    return NextResponse.json({ error: "card_ids required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Find which of these cards already have an ar_to_he row
  const { data: existing, error: fetchErr } = await supabase
    .from("card_srs")
    .select("card_id")
    .in("card_id", card_ids)
    .eq("direction", "ar_to_he");
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const existingSet = new Set((existing ?? []).map((r) => r.card_id as string));
  const toInsert = card_ids.filter((id) => !existingSet.has(id));

  if (toInsert.length === 0) return NextResponse.json({ created: 0, skipped: card_ids.length });

  const { error } = await supabase
    .from("card_srs")
    .insert(toInsert.map((card_id) => ({ card_id, direction: "ar_to_he" })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ created: toInsert.length, skipped: existingSet.size });
}
