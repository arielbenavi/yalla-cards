import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: recording_id } = await context.params;
  const body = await request.json();
  const supabase = supabaseAdmin();

  if (body.card_id) {
    // attach range to an existing card (clip_path is generated client-side and
    // re-sent any time the range is re-attached, so this also covers regeneration)
    const { error } = await supabase
      .from("cards")
      .update({
        recording_id,
        audio_start_sec: body.audio_start_sec,
        audio_end_sec: body.audio_end_sec,
        clip_path: body.clip_path,
      })
      .eq("id", body.card_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // create a new card from this recording's range
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .insert({
      lesson_id: body.lesson_id || null,
      hebrew_meaning: body.hebrew_meaning,
      translit_nikud: body.translit_nikud,
      item_type: body.item_type ?? "phrase",
      recording_id,
      audio_start_sec: body.audio_start_sec,
      audio_end_sec: body.audio_end_sec,
      clip_path: body.clip_path,
    })
    .select()
    .single();

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

  const { error: srsError } = await supabase
    .from("card_srs")
    .insert({ card_id: card.id, direction: "he_to_ar" });

  if (srsError) return NextResponse.json({ error: srsError.message }, { status: 500 });

  return NextResponse.json({ card });
}
