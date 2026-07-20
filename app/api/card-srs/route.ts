import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { card_id, direction } = body as { card_id?: string; direction?: string };

  if (!card_id) return NextResponse.json({ error: "card_id required" }, { status: 400 });
  if (direction !== "ar_to_he") {
    return NextResponse.json({ error: "direction must be ar_to_he" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("card_srs")
    .insert({ card_id, direction: "ar_to_he" })
    .select("id, direction")
    .single();

  if (error) {
    // 23505 = unique_violation — row already exists; return it
    if (error.code === "23505") {
      const { data: existing, error: fetchErr } = await supabase
        .from("card_srs")
        .select("id, direction")
        .eq("card_id", card_id)
        .eq("direction", "ar_to_he")
        .single();
      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      return NextResponse.json({ card_srs: existing });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ card_srs: data });
}
