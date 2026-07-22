import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const lessonId = searchParams.get("lesson_id") ?? "";
  const itemType = searchParams.get("item_type") ?? "";
  const supabase = supabaseAdmin();

  const score = searchParams.get("score") ?? "";

  let query = supabase
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, plural_form, clip_path, lesson_id, self_score, lessons(title, date), card_srs(id, direction)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (q.trim()) {
    query = query.or(`hebrew_meaning.ilike.%${q}%,translit_nikud.ilike.%${q}%`);
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
      .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, plural_form, clip_path, lesson_id, lessons(title, date), card_srs(id, direction)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = (fallback.data ?? []).map((c) => ({ ...c, self_score: null })) as typeof data;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
      return { ...card, audio_url };
    })
  );

  return NextResponse.json({ cards: withAudio });
}
