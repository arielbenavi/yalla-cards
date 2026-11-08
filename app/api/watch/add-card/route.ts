import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// A word or phrase tapped in a video becomes a card at once. Its pointing and meaning come from the automatic
// subtitles, so it lands in a lesson of its own, unverified, with the sentence it came from: easy to
// find and fix. Only the new card's own card_srs row is written.
const LESSON_TITLE = "נוסף מסרטונים (לא מאומת)";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { word, arabic, meaning, sentence, source, seen, clip_path } = (await request.json()) as Record<string, string | null>;
  // Several words selected in the player make a phrase card
  // Several words selected in the player make a phrase card; "a / b / c" is one word's forms
  const itemType = word && word.replace(/\s*\/\s*/g, "/").trim().split(/\s+/).length > 1 ? "phrase" : "word";
  if (!word?.trim() || !meaning?.trim()) return NextResponse.json({ error: "word and meaning required" }, { status: 400 });
  const supabase = supabaseAdmin();

  // The same Arabic word already in the deck is not added twice
  if (arabic?.trim()) {
    const { data: same } = await supabase.from("cards").select("id").eq("arabic_script", arabic.trim()).limit(1);
    if (same?.length) return NextResponse.json({ card_id: same[0].id, existing: true });
  }

  let { data: lesson } = await supabase.from("lessons").select("id").eq("title", LESSON_TITLE).maybeSingle();
  if (!lesson) {
    const created = await supabase
      .from("lessons")
      .insert({ title: LESSON_TITLE, date: new Date().toISOString().slice(0, 10), source: "other", notes: "כרטיסים שנוספו בלחיצה על מילה בסרטון. התעתיק והפירוש אוטומטיים." })
      .select("id")
      .single();
    if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
    lesson = created.data;
  }
  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      translit_nikud: word.trim(), arabic_script: arabic?.trim() || null, hebrew_meaning: meaning.trim(), item_type: itemType,
      notes: [seen, `מסרטון, לא מאומת: ${source ?? ""} · ${sentence ?? ""}`].filter(Boolean).join(" · ").slice(0, 500),
      clip_path: clip_path || null,
      lesson_id: lesson!.id, chatifai_verified: false, course_verified: false,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: e2 } = await supabase.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  return NextResponse.json({ card_id: card.id, existing: false });
}
