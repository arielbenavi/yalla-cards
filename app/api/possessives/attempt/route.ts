import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Records one possessive-drill trial.
 *
 *  Writes possessive_attempts only — never card_srs, review_log or
 *  cards.self_score. `chosen_feature` is what makes the log diagnostic: knowing
 *  the learner picked "his" when the answer was "her" identifies the contrast
 *  that needs more work, which a bare correct/incorrect cannot.
 */
export async function POST(request: NextRequest) {
  const {
    session_id,
    stage,
    base_translit,
    target_feature,
    chosen_feature,
    contrast_with,
    correct,
    latency_ms,
  } = await request.json();

  if (!session_id || !base_translit || !target_feature || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "session_id, base_translit, target_feature and correct required" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("possessive_attempts").insert({
    session_id,
    stage: stage ?? 1,
    base_translit,
    target_feature,
    chosen_feature: correct ? null : chosen_feature ?? null,
    contrast_with: contrast_with ?? null,
    correct,
    latency_ms: latency_ms ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
