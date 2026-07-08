import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { scheduleReview, type CardSrsRow } from "@/lib/fsrs";
import type { Grade } from "ts-fsrs";

export async function POST(request: NextRequest) {
  const { card_srs_id, rating } = (await request.json()) as {
    card_srs_id: string;
    rating: Grade;
  };

  const supabase = supabaseAdmin();

  const { data: row, error: fetchError } = await supabase
    .from("card_srs")
    .select("*")
    .eq("id", card_srs_id)
    .single<CardSrsRow>();

  if (fetchError || !row) {
    return NextResponse.json({ error: fetchError?.message ?? "not found" }, { status: 404 });
  }

  const { cardUpdate, logInsert } = scheduleReview(row, rating);

  const { error: updateError } = await supabase
    .from("card_srs")
    .update(cardUpdate)
    .eq("id", card_srs_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: logError } = await supabase
    .from("review_log")
    .insert({ card_srs_id, ...logInsert });

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

  return NextResponse.json({ ok: true, next_due: cardUpdate.due });
}
