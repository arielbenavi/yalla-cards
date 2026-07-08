import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { config } from "@/lib/config";

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeStreak(reviewDates: string[]): number {
  const days = new Set(reviewDates.map((d) => toDayKey(new Date(d))));
  let streak = 0;
  const cursor = new Date();

  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function GET() {
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  const [{ count: dueToday }, { count: totalCards }, { data: reviewLog }, { data: matureRows }] =
    await Promise.all([
      supabase.from("card_srs").select("id", { count: "exact", head: true }).lte("due", now),
      supabase.from("cards").select("id", { count: "exact", head: true }),
      supabase.from("review_log").select("reviewed_at").order("reviewed_at", { ascending: false }).limit(2000),
      supabase
        .from("card_srs")
        .select("card_id")
        .gte("scheduled_days", config.matureScheduledDaysThreshold),
    ]);

  const streak = computeStreak((reviewLog ?? []).map((r) => r.reviewed_at));
  const matureCards = new Set((matureRows ?? []).map((r) => r.card_id)).size;

  return NextResponse.json({
    due_today: dueToday ?? 0,
    streak,
    total_cards: totalCards ?? 0,
    mature_cards: matureCards,
  });
}
