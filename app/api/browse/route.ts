import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { focusedMastery } from "@/lib/focused-practice";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const lessonId = searchParams.get("lesson_id") ?? "";
  const itemType = searchParams.get("item_type") ?? "";
  const supabase = supabaseAdmin();

  const score = searchParams.get("score") ?? "";

  let query = supabase
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, plural_form, clip_path, lesson_id, self_score, audio_start_sec, audio_end_sec, recording_id, lessons(title, date), card_srs(id, direction)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (q.trim()) {
    // Split on whitespace so spaces in the query don't break PostgREST's or() parsing.
    // Each term ANDs together; each term ORs across columns.
    for (const term of q.trim().split(/\s+/).filter(Boolean)) {
      query = query.or(`hebrew_meaning.ilike.%${term}%,translit_nikud.ilike.%${term}%`);
    }
  }
  if (lessonId) {
    query = query.eq("lesson_id", lessonId);
  }
  if (itemType) {
    query = query.eq("item_type", itemType);
  }
  if (score) {
    query = query.eq("self_score", parseInt(score, 10));
  }

  let { data, error } = await query;

  // Graceful fallback: if self_score column doesn't exist yet, retry without it
  if (error?.message?.includes("self_score")) {
    const fallback = await supabase
      .from("cards")
      .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, plural_form, clip_path, lesson_id, audio_start_sec, audio_end_sec, recording_id, lessons(title, date), card_srs(id, direction)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = (fallback.data ?? []).map((c) => ({ ...c, self_score: null })) as typeof data;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Focused-practice performance, computed at read time. This is what lets a
  // drill affect how a card is classified here without writing self_score,
  // card_srs or review_log — see lib/focused-practice.ts for why.
  const cardIds = (data ?? []).map((c) => c.id);
  const srsToCard = new Map<string, string>();
  for (const c of data ?? []) {
    for (const s of (c.card_srs ?? []) as { id: string }[]) srsToCard.set(s.id, c.id);
  }

  // Fetch the whole log and join in memory rather than filtering by id: an
  // .in() over ~850 card_srs ids overflows the PostgREST URL and comes back
  // empty, and this table is small by construction.
  const attemptsByCard = new Map<string, { outcome: number; practiced_at: string }[]>();
  if (srsToCard.size > 0) {
    const { data: fp } = await supabase
      .from("focused_practice_log")
      .select("card_srs_id, outcome, practiced_at");
    for (const row of fp ?? []) {
      const cardId = srsToCard.get(row.card_srs_id);
      if (!cardId) continue;
      if (!attemptsByCard.has(cardId)) attemptsByCard.set(cardId, []);
      attemptsByCard.get(cardId)!.push({ outcome: row.outcome, practiced_at: row.practiced_at });
    }
  }
  void cardIds;

  // Generate signed audio URLs for cards with clips
  const withAudio = await Promise.all(
    (data ?? []).map(async (card) => {
      let audio_url: string | null = null;
      if (card.clip_path) {
        const { data: signed } = await supabase.storage
          .from("recordings")
          .createSignedUrl(card.clip_path, 60 * 10);
        audio_url = signed?.signedUrl ?? null;
      }
      const mastery = focusedMastery(attemptsByCard.get(card.id) ?? []);
      return { ...card, audio_url, focused: mastery };
    })
  );

  return NextResponse.json({ cards: withAudio });
}
