import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { checkSong } from "@/lib/song-schema";

/**
 * `he` is a translation, never an explanation. A particle with no Hebrew
 * equivalent (عم, marking the progressive) gets an empty `he` so the flowing
 * translation line reads as a sentence, and its grammar goes in `note`.
 */
export type LyricWord = { ar: string; he: string; translit: string; note?: string };
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
  - translit: HEBREW-letter transliteration of the Arabic word, vocalised with nikud

CRITICAL — the transliteration must be in HEBREW letters, never Latin letters.
The learner reads Hebrew; a Latin transliteration like "wakha" or "l-hbal" is
unusable to him. Write וַאחַ'א, not "wakha". Use the Levantine conventions:
ח' for خ, ע' for غ, ג' for ج, צ' for ض/ظ, ת' for ث, ד' for ذ, ע for ع, ק for ق.
Vocalise with nikud. Do not put Latin letters in the translit field or in the he field.

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
  let schema_issues: ReturnType<typeof checkSong> = [];
  try {
    lyrics_parsed = await parseLyrics(lyrics_raw);
    // Note efbd5595: two of the eight existing songs landed with Arabic in the
    // transliteration field or Hebrew in the Arabic field, because nothing
    // checked. The song is still saved — a partly-glossed song beats none — but
    // the problems come back in the response instead of being discovered months
    // later.
    schema_issues = checkSong(lyrics_parsed ?? []);
    if (schema_issues.length) {
      console.warn(`[songs] ${title}: ${schema_issues.length} schema issue(s)`);
    }
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
  return NextResponse.json({
    id: data.id,
    ...(schema_issues.length ? { schema_issues } : {}),
  });
}
