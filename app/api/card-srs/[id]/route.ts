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
