import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const EVENTS = new Set(["example_shown", "fix_round_offered", "fix_round_started", "word_tapped", "word_requested", "next_practice_started"]);

/** Best-effort usage log. learning_events only, never FSRS state. */
export async function POST(request: NextRequest) {
  const { event, card_id, meta } = await request.json();
  if (!EVENTS.has(event)) return NextResponse.json({ error: "unknown event" }, { status: 400 });
  const { error } = await supabaseAdmin()
    .from("learning_events")
    .insert({ event, card_id: card_id ?? null, meta: meta ?? {} });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
