import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { direction } = await request.json();
  if (direction !== "he_to_ar" && direction !== "ar_to_he") {
    return NextResponse.json({ error: "invalid direction" }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("card_srs").update({ direction }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  // Safety: only allow deleting ar_to_he rows to prevent accidentally removing he_to_ar data
  const { data: row, error: fetchErr } = await supabase
    .from("card_srs")
    .select("direction")
    .eq("id", id)
    .single();
  if (fetchErr || !row) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (row.direction !== "ar_to_he") {
    return NextResponse.json({ error: "can only delete ar_to_he rows" }, { status: 400 });
  }

  // review_log rows cascade-delete automatically (on delete cascade in schema)
  const { error } = await supabase.from("card_srs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
