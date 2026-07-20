import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { scheduleReview, type CardSrsRow } from "@/lib/fsrs";
import type { Grade } from "ts-fsrs";

export async function POST(request: NextRequest) {
  const { srs_id, rating } = (await request.json()) as {
    srs_id: string;
    rating: Grade;
  };

  const supabase = supabaseAdmin();

  const { data: row, error: fetchError } = await supabase
    .from("conjugation_srs")
    .select("*")
    .eq("id", srs_id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: fetchError?.message ?? "not found" }, { status: 404 });
  }

  // conjugation_srs has the same FSRS fields as card_srs — cast is safe
  const { cardUpdate } = scheduleReview(row as unknown as CardSrsRow, rating);

  const { error: updateError } = await supabase
    .from("conjugation_srs")
    .update(cardUpdate)
    .eq("id", srs_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, next_due: cardUpdate.due });
}
