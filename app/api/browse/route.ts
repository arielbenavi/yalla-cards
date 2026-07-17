import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const lessonId = searchParams.get("lesson_id") ?? "";
  const itemType = searchParams.get("item_type") ?? "";
  const supabase = supabaseAdmin();

  let query = supabase
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, plural_form, clip_path, lesson_id, lessons(title, date)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q.trim()) {
    query = query.or(`hebrew_meaning.ilike.%${q}%,translit_nikud.ilike.%${q}%`);
  }
  if (lessonId) {
    query = query.eq("lesson_id", lessonId);
  }
  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  const { data, error } = await query;
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
