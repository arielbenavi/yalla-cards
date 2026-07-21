/**
 * One-off script to add YAMA by Dystinct to the songs table.
 * Run: npx tsx scripts/add-song-yama.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const LYRICS_RAW = `كله بيسأل
شو بدك؟
و أنا دوّخني الجمال
اسمع، اسمع، اسمع
اسمع، اسمع، اسمع
بدي أنا؟ شو بدي؟
أنا غيرك ما بدي
شو مهدومة يا حبي
يا عمري خليك حدّي
بدي أنا؟ شو بدي؟
أنا غيرك ما بدي
شو مهدومة يا حبي
يا عمري خليك حدّي
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ممكن أعصر بالليمون
مو مصدّق هالعيون
جوابتني بالتلفون
يا ويلي صاير مجنون
سلّملـي عالشباب
واللي جايّ واللي غاب
حبيبتي في الدماغ
قلبي أنا قلبي ضاع
جوال، جوال، جوال، جوال
جوال، جوال، جوال، جوال، جوال
بدي أنا؟ شو بدي؟
أنا غيرك ما بدي
شو مهدومة يا حبي
يا عمري خليك حدّي
بدي أنا؟ شو بدي؟
أنا غيرك ما بدي
شو مهدومة يا حبي
يا عمري خليك حدّي
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
هيرميز و لويس فويتون
مصاري في الكومبت
ألفت بك الكون
بحبك دايم دوم
حبيبي يا عيني
حبيبي يا روحي
يا واخذ مني الروح
حبيبي لا تروحي
ياما ياما ياما ياما ياما
بدي أنا؟ شو بدي؟
أنا غيرك ما بدي
شو مهدومة يا حبي
يا عمري خليك حدّي
بدي أنا؟ شو بدي؟
أنا غيرك ما بدي
شو مهدومة يا حبي
يا عمري خليك حدّي
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما
ياما ياما ياما ياما ياما`;

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

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, realtime: { transport: class {} as any } }
  );

  // Check if already inserted
  const { data: existing } = await supabase
    .from("songs")
    .select("id")
    .eq("title", "YAMA")
    .eq("artist", "Dystinct")
    .maybeSingle();

  if (existing) {
    console.log("Song already exists:", existing.id);
    return;
  }

  console.log("Parsing lyrics with Gemini...");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: lyricsSchema,
    },
  });

  const prompt = `Parse these Arabic song lyrics into structured JSON. Levantine/Palestinian dialect.

For each LINE of Arabic lyrics output a line object with:
- line: the original Arabic line text
- words: array per word with:
  - ar: Arabic word (Arabic script)
  - he: Hebrew translation of that word
  - translit: Latin transliteration

Skip pure "ياما" repeat lines — treat each "ياما ياما ياما ياما ياما" as one line with one word object.

Lyrics:
${LYRICS_RAW}`;

  const result = await model.generateContent(prompt);
  const lyrics_parsed = JSON.parse(result.response.text());
  console.log(`Parsed ${lyrics_parsed.length} lines`);

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title: "YAMA",
      artist: "Dystinct",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed,
      youtube_url: "https://www.youtube.com/watch?v=QRHhWwdX59k",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Insert error:", error.message);
    process.exit(1);
  }

  console.log("Song inserted:", data.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
