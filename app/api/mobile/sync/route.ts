import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { scheduleReview, type CardSrsRow } from "@/lib/fsrs";
import type { Grade } from "ts-fsrs";

// Grades made on the iPhone, possibly offline, sent up when it is back online.
//
// Each one goes through the same scheduleReview as /api/review/grade, with the
// time it was actually made on the phone, so a card graded on the train in the
// morning is scheduled from the morning, not from when the phone found signal.
//
// - Sent twice (a retry after a lost response): the review_log row with that
//   card and that exact time already exists, so it is skipped.
// - Older than the card's last review (it was reviewed on the web meanwhile):
//   skipped — replaying it would rewind the schedule.
//
// `dry_run` computes everything and writes nothing; the app's test build uses it.
export const maxDuration = 60;

type Incoming = { card_srs_id: string; rating: Grade; reviewed_at: string };
type Outcome = "applied" | "duplicate" | "stale" | "not_found" | "invalid";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { reviews?: Incoming[]; dry_run?: boolean };
  const reviews = (body.reviews ?? [])
    .slice()
    .sort((a, b) => new Date(a.reviewed_at).getTime() - new Date(b.reviewed_at).getTime());
  const dryRun = body.dry_run === true;
  const supabase = supabaseAdmin();

  const results: { card_srs_id: string; reviewed_at: string; outcome: Outcome; next_due?: string }[] = [];

  for (const r of reviews) {
    const at = new Date(r.reviewed_at);
    const result = (outcome: Outcome, next_due?: string) =>
      results.push({ card_srs_id: r.card_srs_id, reviewed_at: r.reviewed_at, outcome, next_due });

    if (![1, 2, 3, 4].includes(r.rating) || isNaN(at.getTime()) || at.getTime() > Date.now() + 5 * 60 * 1000) {
      result("invalid");
      continue;
    }

    const { data: seen } = await supabase
      .from("review_log")
      .select("id")
      .eq("card_srs_id", r.card_srs_id)
      .eq("reviewed_at", at.toISOString())
      .limit(1);
    if (seen?.length) {
      result("duplicate");
      continue;
    }

    const { data: row } = await supabase.from("card_srs").select("*").eq("id", r.card_srs_id).maybeSingle<CardSrsRow>();
    if (!row) {
      result("not_found");
      continue;
    }
    // ≥, not >: equal means this very review was applied and its log insert failed
    if (row.last_review && new Date(row.last_review).getTime() >= at.getTime()) {
      result("stale");
      continue;
    }

    const { cardUpdate, logInsert } = scheduleReview(row, r.rating, at);
    if (!dryRun) {
      const { error: updateError } = await supabase.from("card_srs").update(cardUpdate).eq("id", r.card_srs_id);
      if (updateError) return NextResponse.json({ error: updateError.message, results }, { status: 500 });
      const { error: logError } = await supabase
        .from("review_log")
        .insert({ card_srs_id: r.card_srs_id, ...logInsert, reviewed_at: at.toISOString() });
      if (logError) return NextResponse.json({ error: logError.message, results }, { status: 500 });
    }
    result("applied", cardUpdate.due);
  }

  return NextResponse.json({ results, dry_run: dryRun });
}
