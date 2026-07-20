import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fsrs, generatorParameters, type Card as FsrsCard, type Grade, State } from "ts-fsrs";
import type { LyricLine } from "@/app/api/songs/route";

type SongWordSrsRow = {
  id: string;
  song_id: string;
  word_index: number;
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
};

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

function rowToFsrsCard(row: SongWordSrsRow): FsrsCard {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

// GET /api/songs/[id]/review — returns due SRS rows with word data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: song_id } = await params;
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  // Fetch song lyrics
  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("lyrics_parsed")
    .eq("id", song_id)
    .single();

  if (songError || !song) {
    return NextResponse.json({ error: "song not found" }, { status: 404 });
  }

  const lyrics = song.lyrics_parsed as LyricLine[] | null;
  if (!lyrics) return NextResponse.json({ items: [] });

  const allWords = lyrics.flatMap((l) => l.words);

  // Fetch due items
  const { data: dueRows, error: dueError } = await supabase
    .from("song_word_srs")
    .select("*")
    .eq("song_id", song_id)
    .lte("due", now)
    .order("due", { ascending: true })
    .limit(20);

  if (dueError) return NextResponse.json({ error: dueError.message }, { status: 500 });

  const items = (dueRows ?? []).map((row) => {
    const word = allWords[row.word_index];
    return {
      srs_id: row.id,
      word_index: row.word_index,
      ar: word?.ar ?? "",
      he: word?.he ?? "",
      translit: word?.translit ?? "",
      state: row.state,
    };
  });

  return NextResponse.json({ items, all_words: allWords });
}

// POST /api/songs/[id]/review — submit rating for a word
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // song_id not needed, we look up by srs_id
  const { srs_id, rating } = (await request.json()) as {
    srs_id: string;
    rating: Grade;
  };

  const supabase = supabaseAdmin();

  const { data: row, error: fetchError } = await supabase
    .from("song_word_srs")
    .select("*")
    .eq("id", srs_id)
    .single<SongWordSrsRow>();

  if (fetchError || !row) {
    return NextResponse.json({ error: fetchError?.message ?? "not found" }, { status: 404 });
  }

  const current = rowToFsrsCard(row);
  const now = new Date();
  const recordLog = scheduler.repeat(current, now);
  const { card } = recordLog[rating];

  const update = {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: now.toISOString(),
  };

  const { error: updateError } = await supabase
    .from("song_word_srs")
    .update(update)
    .eq("id", srs_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true, next_due: update.due });
}
