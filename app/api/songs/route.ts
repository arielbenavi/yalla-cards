import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

export type LyricWord = { ar: string; he: string; translit: string };
export type LyricLine = { line: string; words: LyricWord[] };

const lyricsSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      line: { type: SchemaType.STRING },
      words: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            ar: { type: SchemaType.STRING },
            he: { type: SchemaType.STRING },
            translit: { type: SchemaType.STRING },
          },
          required: ["ar", "he", "translit"],
        },
      },
    },
    required: ["line", "words"],
  },
};

async function parseLyrics(lyricsRaw: string): Promise<LyricLine[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: lyricsSchema,
    },
  });

  const prompt = `Parse these Arabic song lyrics into structured JSON. The lyrics may be in Arabic script, Hebrew transliteration, or may include Hebrew translation lines alongside.

For each LINE of Arabic lyrics, output a line object with:
- line: the original line text (Arabic script or transliteration as provided)
- words: array of word objects, one per word in that line, each with:
  - ar: the Arabic word (in Arabic script if available, otherwise the transliterated form)
  - he: the Hebrew translation of that word
  - translit: Latin-alphabet transliteration of the Arabic word

Skip empty lines and lines that are purely Hebrew (not Arabic). If a Hebrew translation line follows an Arabic line, use it to inform the word-level translations.

Palestinian/Levantine Arabic dialect context.

Lyrics:
${lyricsRaw}`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as LyricLine[];
}

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("songs")
    .select("id, title, artist, youtube_url, cover_url, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ songs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { title, artist, lyrics_raw, youtube_url } = (await request.json()) as {
    title: string;
    artist: string;
    lyrics_raw: string;
    youtube_url?: string;
  };

  if (!title || !artist || !lyrics_raw) {
    return NextResponse.json({ error: "title, artist, lyrics_raw are required" }, { status: 400 });
  }

  let lyrics_parsed: LyricLine[] | null = null;
  try {
    lyrics_parsed = await parseLyrics(lyrics_raw);
  } catch (err) {
    console.error("lyrics parse error", err);
    // Save without parsed lyrics — can be retried later
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("songs")
    .insert({ title, artist, lyrics_raw, lyrics_parsed, youtube_url: youtube_url || null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
