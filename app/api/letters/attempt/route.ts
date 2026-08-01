import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Records one letter trial.
 *
 *  Writes to letter_attempts ONLY — never card_srs, review_log or
 *  cards.self_score. `selected_letter` is what makes the confusion matrix
 *  possible: without it a wrong answer says nothing about which letters are
 *  actually being mixed up.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { session_id, target_letter, positional_form, task_type, correct, selected_letter, card_id, latency_ms } = body;

  if (!session_id || !target_letter || !positional_form || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "session_id, target_letter, positional_form and correct required" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("letter_attempts").insert({
    session_id,
    target_letter,
    positional_form,
    task_type: task_type ?? "choose_sound",
    correct,
    selected_letter: correct ? null : selected_letter ?? null,
    card_id: card_id ?? null,
    latency_ms: latency_ms ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
