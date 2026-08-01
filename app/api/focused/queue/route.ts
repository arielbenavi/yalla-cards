import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Rating } from "@/lib/fsrs";
import {
  SESSION_SIZES,
  selectSession,
  isEligible,
  type Candidate,
  type SessionMinutes,
} from "@/lib/focused-practice";

/** Builds a focused-practice session (note ac2ed4f2).
 *
 *  Reads FSRS state; writes nothing. Attempts go to focused_practice_log via
 *  POST /api/focused/log, never to review_log or card_srs.
 */
export async function GET(request: Request) {
  const minutesParam = Number(new URL(request.url).searchParams.get("minutes") ?? 20);
  const minutes = (minutesParam in SESSION_SIZES ? minutesParam : 20) as SessionMinutes;
  const size = SESSION_SIZES[minutes].items;

  const supabase = supabaseAdmin();
  const now = Date.now();

  type CardJoin = {
    id: string;
    hebrew_meaning: string;
    translit_nikud: string;
    arabic_script: string | null;
    item_type: string;
    notes: string | null;
    clip_path: string | null;
    lesson_id: string | null;
  };
  type SrsRow = {
    id: string;
    card_id: string;
    due: string;
    stability: number | null;
    difficulty: number | null;
    lapses: number | null;
    state: number | null;
    last_review: string | null;
    direction: "he_to_ar" | "ar_to_he";
    card: CardJoin | CardJoin[] | null;
  };

  const [srsResult, { data: lessons }] = await Promise.all([
    supabase
      .from("card_srs")
      .select(
        "id, card_id, due, stability, difficulty, lapses, state, last_review, direction, " +
          "card:cards(id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, clip_path, lesson_id)"
      )
      .neq("state", 0),
    supabase.from("lessons").select("id, date"),
  ]);
  if (srsResult.error) {
    return NextResponse.json({ error: srsResult.error.message }, { status: 500 });
  }
  const srsRows = (srsResult.data ?? []) as unknown as SrsRow[];

  const lessonDate = new Map((lessons ?? []).map((l) => [l.id, l.date as string | null]));

  // Most recent Again and Hard per card, and the last focused attempt
  const [{ data: logs }, { data: focused }] = await Promise.all([
    supabase
      .from("review_log")
      .select("card_srs_id, rating, reviewed_at")
      .in("rating", [Rating.Again, Rating.Hard])
      .order("reviewed_at", { ascending: false }),
    supabase
      .from("focused_practice_log")
      .select("card_srs_id, practiced_at")
      .order("practiced_at", { ascending: false }),
  ]);

  const lastAgain = new Map<string, string>();
  const lastHard = new Map<string, string>();
  for (const l of logs ?? []) {
    const target = l.rating === Rating.Again ? lastAgain : lastHard;
    if (!target.has(l.card_srs_id)) target.set(l.card_srs_id, l.reviewed_at);
  }
  const lastFocused = new Map<string, string>();
  for (const f of focused ?? []) {
    if (!lastFocused.has(f.card_srs_id)) lastFocused.set(f.card_srs_id, f.practiced_at);
  }

  const byId = new Map<string, SrsRow>();
  const candidates: Candidate[] = srsRows.map((row) => {
    byId.set(row.id, row);
    const card = Array.isArray(row.card) ? row.card[0] : row.card;
    return {
      card_srs_id: row.id,
      card_id: card?.id ?? "",
      lesson_id: card?.lesson_id ?? null,
      lesson_date: lessonDate.get(card?.lesson_id ?? "") ?? null,
      stability: Number(row.stability ?? 0),
      difficulty: Number(row.difficulty ?? 5),
      lapses: Number(row.lapses ?? 0),
      state: Number(row.state ?? 0),
      due: row.due,
      last_review: row.last_review,
      last_again_at: lastAgain.get(row.id) ?? null,
      last_hard_at: lastHard.get(row.id) ?? null,
      last_focused_at: lastFocused.get(row.id) ?? null,
    };
  });

  const eligibleCount = candidates.filter((c) => isEligible(c, now)).length;
  const chosen = selectSession(candidates, size, now);

  const cards = await Promise.all(
    chosen.map(async (c) => {
      const row = byId.get(c.card_srs_id)!;
      const card = Array.isArray(row.card) ? row.card[0] : row.card;

      let audioUrl: string | null = null;
      if (card?.clip_path) {
        const { data } = await supabase.storage
          .from("recordings")
          .createSignedUrl(card.clip_path, 60 * 10);
        audioUrl = data?.signedUrl ?? null;
      }

      return {
        card_srs_id: row.id,
        card_id: card?.id,
        direction: row.direction,
        hebrew_meaning: card?.hebrew_meaning,
        translit_nikud: card?.translit_nikud,
        arabic_script: card?.arabic_script,
        item_type: card?.item_type,
        notes: card?.notes,
        audio_url: audioUrl,
      };
    })
  );

  return NextResponse.json({
    cards,
    minutes,
    planned_items: size,
    eligible_total: eligibleCount,
  });
}
