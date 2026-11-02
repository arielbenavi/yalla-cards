import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// approve: the clip reaches the card (only one that has none, so a hand-made clip
// can't be overwritten). reject: this range is wrong, the card's next guess stays in
// the queue. no_audio: no guess for this card is right, the card leaves the queue.
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const supabase = supabaseAdmin();
  const decided_at = new Date().toISOString();

  const { data: suggestion, error } = await supabase
    .from("clip_suggestions")
    .select("card_id,recording_id")
    .eq("id", id)
    .single();
  if (error || !suggestion) return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });

  if (body.action === "approve") {
    if (!body.clip_path || !(body.end > body.start)) {
      return NextResponse.json({ error: "clip_path, start and end are required" }, { status: 400 });
    }
    const { data: updated, error: cardError } = await supabase
      .from("cards")
      .update({
        recording_id: suggestion.recording_id,
        audio_start_sec: body.start,
        audio_end_sec: body.end,
        clip_path: body.clip_path,
      })
      .eq("id", suggestion.card_id)
      .is("clip_path", null)
      .select("id");
    if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });
    if (!updated?.length) return NextResponse.json({ error: "card already has a clip" }, { status: 409 });

    await supabase
      .from("clip_suggestions")
      .update({ status: "approved", final_start_sec: body.start, final_end_sec: body.end, decided_at })
      .eq("id", id);
    await supabase
      .from("clip_suggestions")
      .update({ status: "superseded", decided_at })
      .eq("card_id", suggestion.card_id)
      .eq("status", "pending");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await supabase.from("clip_suggestions").update({ status: "rejected", decided_at }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "no_audio") {
    await supabase
      .from("clip_suggestions")
      .update({ status: "rejected", decided_at })
      .eq("card_id", suggestion.card_id)
      .eq("status", "pending");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
