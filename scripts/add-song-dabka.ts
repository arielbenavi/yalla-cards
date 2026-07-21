/**
 * Adds דבקה בתל אביב by Eyal Golan (Arabic parts by נאורס חנין).
 * Transliteration validated by chatifai 2026-07-22.
 * Run: npx tsx scripts/add-song-dabka.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

type LyricWord = { ar: string; he: string; translit: string };
type LyricLine = { line: string; words: LyricWord[] };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const LYRICS_RAW = `أسمع يا ولد
حبيبه الدبكه بتل أبيب
وأجينا ندبك، ندبك، ندبك، ندبك

الزلم صبو صبوها
وحدودي متعدوها
المراجل بس النا
نحن أمها وأبوها

زيد الثلج صب الكأس
صار الوضع رأس برأس
والدبكه عنا بتل أبيب
أشي والله بيرفع الرأس
أحلى دبكة`;

// Chatifai-validated transliteration + word-level breakdown
const LYRICS_PARSED: LyricLine[] = [
  {
    line: "אִסְמַע יַא וַלַד",
    words: [
      { ar: "أسمع", he: "תקשיב", translit: "isma'" },
      { ar: "يا", he: "יא", translit: "ya" },
      { ar: "ولد", he: "ילד/בחור", translit: "walad" },
    ],
  },
  {
    line: "חַבִּיבֵּה אִל-דַבְּכֵּה בְּתֵל אַבִּיבּ",
    words: [
      { ar: "حبيبه", he: "אהובה", translit: "Habibe" },
      { ar: "الدبكه", he: "הדבקה", translit: "id-dabke" },
      { ar: "بتل", he: "בתל", translit: "b-tel" },
      { ar: "أبيب", he: "אביב", translit: "aviv" },
    ],
  },
  {
    line: "וּאַגֵ'ינַא נִדְבֹּכּ, נִדְבֹּכּ, נִדְבֹּכּ, נִדְבֹּכּ",
    words: [
      { ar: "وأجينا", he: "ובאנו", translit: "wa-ajeyna" },
      { ar: "ندبك", he: "נרקוד דבקה", translit: "nidbok" },
    ],
  },
  {
    line: "אִזְ-זְלַאם צַבּוּ צַבּוּהַא",
    words: [
      { ar: "الزلم", he: "הגברים", translit: "iz-zlam" },
      { ar: "صبو", he: "מזגו", translit: "sabbu" },
      { ar: "صبوها", he: "מזגו אותה", translit: "sabbuha" },
    ],
  },
  {
    line: "וּחְדוּדִי מַא תְעַדּוּהַא",
    words: [
      { ar: "وحدودي", he: "והגבולות שלי", translit: "w-Hduди" },
      { ar: "متعدوها", he: "אל תעברו אותם", translit: "ma t'adduha" },
    ],
  },
  {
    line: "אִל-מַרַאגֵ'ל בַּס אִלְנַא",
    words: [
      { ar: "المراجل", he: "הגבריות/האומץ", translit: "il-marajel" },
      { ar: "بس", he: "רק", translit: "bas" },
      { ar: "النا", he: "לנו", translit: "ilna" },
    ],
  },
  {
    line: "אִחְנַא אֻמְּהַא וּאַבּוּהַא",
    words: [
      { ar: "نحن", he: "אנחנו", translit: "iHna" },
      { ar: "أمها", he: "אמה", translit: "ummha" },
      { ar: "وأبوها", he: "ואביה", translit: "wa-abuha" },
    ],
  },
  {
    line: "זִיד אִל-תַ'לְג' צַבּ אִל-כַּאס",
    words: [
      { ar: "زيد", he: "תוסיף", translit: "zid" },
      { ar: "الثلج", he: "הקרח", translit: "it-talj" },
      { ar: "صب", he: "מזוג", translit: "sabb" },
      { ar: "الكأس", he: "הכוס", translit: "il-kaas" },
    ],
  },
  {
    line: "צַאר אִל-וַצֵ'ע רַאס בְּרַאס",
    words: [
      { ar: "صار", he: "נהיה", translit: "saar" },
      { ar: "الوضع", he: "המצב", translit: "il-waD'a'" },
      { ar: "رأس برأس", he: "ראש בראש", translit: "raas b-raas" },
    ],
  },
  {
    line: "וִאִל-דַבְּכֵּה עִנַא בְּתֵל אַבִּיבּ",
    words: [
      { ar: "والدبكه", he: "והדבקה", translit: "w-id-dabke" },
      { ar: "عنا", he: "אצלנו", translit: "'inna" },
      { ar: "بتل أبيب", he: "בתל אביב", translit: "b-tel aviv" },
    ],
  },
  {
    line: "אִשִי וַאללַּה בִּירְפַע אִל-רַאס",
    words: [
      { ar: "أشي", he: "משהו", translit: "ishi" },
      { ar: "والله", he: "בחיי אללה", translit: "wallah" },
      { ar: "بيرفع", he: "מרים", translit: "biyrfa'" },
      { ar: "الرأس", he: "את הראש", translit: "ir-raas" },
    ],
  },
  {
    line: "אַחְלַא דַבְּכֵּה",
    words: [
      { ar: "أحلى", he: "הכי יפה", translit: "aHla" },
      { ar: "دبكة", he: "דבקה", translit: "dabke" },
    ],
  },
];

async function main() {
  const { data: existing } = await supabase
    .from("songs")
    .select("id")
    .eq("title", "דבקה בתל אביב")
    .maybeSingle();

  if (existing) {
    console.log("Song already exists:", existing.id);
    return;
  }

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title: "דבקה בתל אביב",
      artist: "אייל גולן & נאורס חנין",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed: LYRICS_PARSED,
      youtube_url: "https://www.youtube.com/watch?v=zQcCw3ZIkf0",
    })
    .select("id")
    .single();

  if (error) { console.error(error.message); process.exit(1); }
  console.log("Song inserted:", data.id);
  console.log(`${LYRICS_PARSED.length} lines with chatifai-validated nikud`);
}

main().catch((e) => { console.error(e); process.exit(1); });
