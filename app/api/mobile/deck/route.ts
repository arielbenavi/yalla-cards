import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { DeckCard, ReviewEvent } from "@/lib/daily-queue";

// The whole deck with its FSRS state, for the iPhone app to keep on the phone
// and review from with no network. The app builds the daily queue itself
// (lib/daily-queue.ts) from this and the last two days of review_log.
//
// Read only.
export const maxDuration = 60;

const SELECT =
  "id, direction, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, card:cards(id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, clip_path, lesson_id, audio_start_sec, audio_end_sec)";

type Row = {
  id: string;
  direction: "he_to_ar" | "ar_to_he";
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  card: {
    id: string;
    hebrew_meaning: string;
    translit_nikud: string;
    arabic_script: string | null;
    item_type: string;
    notes: string | null;
    clip_path: string | null;
    lesson_id: string | null;
    audio_start_sec: number | null;
    audio_end_sec: number | null;
  } | null;
};

export async function GET() {
  const supabase = supabaseAdmin();

  // PostgREST caps a read at 1000 rows
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("card_srs")
      .select(SELECT)
      .order("id")
      .range(from, from + 999)
      .returns<Row[]>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const { data: lessons } = await supabase.from("lessons").select("id, date");
  const lessonDate = new Map((lessons ?? []).map((l) => [l.id as string, (l.date as string | null) ?? ""]));

  // Two days back covers "today" in any time zone the phone is in
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: logs, error: logError } = await supabase
    .from("review_log")
    .select("card_srs_id, rating, state, reviewed_at")
    .gte("reviewed_at", since)
    .returns<ReviewEvent[]>();
  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

  const cards: DeckCard[] = rows
    .filter((r) => r.card)
    .map((r) => ({
      card_srs_id: r.id,
      card_id: r.card!.id,
      direction: r.direction,
      hebrew_meaning: r.card!.hebrew_meaning,
      translit_nikud: r.card!.translit_nikud,
      arabic_script: r.card!.arabic_script,
      item_type: r.card!.item_type,
      notes: r.card!.notes,
      clip_path: r.card!.clip_path,
      audio_start_sec: r.card!.audio_start_sec,
      audio_end_sec: r.card!.audio_end_sec,
      lesson_date: lessonDate.get(r.card!.lesson_id ?? "") ?? "",
      srs: {
        due: r.due,
        stability: r.stability,
        difficulty: r.difficulty,
        elapsed_days: r.elapsed_days,
        scheduled_days: r.scheduled_days,
        learning_steps: r.learning_steps,
        reps: r.reps,
        lapses: r.lapses,
        state: r.state,
        last_review: r.last_review,
      },
    }));

  // One signed link per clip, for the phone to download and keep
  const paths = [...new Set(cards.map((c) => c.clip_path).filter((p): p is string => !!p))];
  const audio: Record<string, string> = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("recordings").createSignedUrls(paths, 60 * 60);
    for (const s of signed ?? []) if (s.path && s.signedUrl) audio[s.path] = s.signedUrl;
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    cards,
    reviews: logs ?? [],
    audio,
  });
}
