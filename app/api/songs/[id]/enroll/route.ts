import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { LyricLine } from "@/app/api/songs/route";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: song_id } = await params;
  const supabase = supabaseAdmin();

  // Fetch parsed lyrics
  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("lyrics_parsed")
    .eq("id", song_id)
    .single();

  if (songError || !song) {
    return NextResponse.json({ error: songError?.message ?? "song not found" }, { status: 404 });
  }

  const lyrics = song.lyrics_parsed as LyricLine[] | null;
  if (!lyrics || lyrics.length === 0) {
    return NextResponse.json({ error: "song has no parsed lyrics yet" }, { status: 400 });
  }

  // Flatten all words to get word count
  const allWords = lyrics.flatMap((l) => l.words);
  const totalWords = allWords.length;

  if (totalWords === 0) {
    return NextResponse.json({ error: "no words found in parsed lyrics" }, { status: 400 });
  }

  // Upsert SRS rows for each word (skip existing)
  const rows = Array.from({ length: totalWords }, (_, i) => ({
    song_id,
    word_index: i,
  }));

  const { error: upsertError } = await supabase
    .from("song_word_srs")
    .upsert(rows, { onConflict: "song_id,word_index", ignoreDuplicates: true });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enrolled: totalWords });
}
