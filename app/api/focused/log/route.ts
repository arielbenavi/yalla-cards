import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Records one focused-practice attempt.
 *
 *  Writes to focused_practice_log ONLY. It must never touch card_srs,
 *  review_log or cards.self_score — focused practice is a drill, and drills do
 *  not move FSRS state. tests/e2e/reversibility.spec.ts enforces this.
 */
export async function POST(request: NextRequest) {
  const { session_id, card_srs_id, outcome, attempt_index, latency_ms, hint_used } =
    await request.json();

  if (!session_id || !card_srs_id || ![1, 2, 3, 4].includes(outcome)) {
    return NextResponse.json({ error: "session_id, card_srs_id and outcome required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("focused_practice_log").insert({
    session_id,
    card_srs_id,
    outcome,
    attempt_index: attempt_index ?? 1,
    latency_ms: latency_ms ?? null,
    hint_used: Boolean(hint_used),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
