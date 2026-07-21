/**
 * Updates YAMA by Dystinct with the full transliteration from chatifai (2026-07-22).
 * 19 lines — complete שורה שורה response, no lines skipped.
 * Run: npx tsx scripts/update-yama-full.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

type LyricWord = { ar: string; he: string; translit: string };
type LyricLine = { line: string; words: LyricWord[] };

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const LYRICS_PARSED: LyricLine[] = [
  {
    line: "כֻּלּוֹ בִּיִסְאַל: שׁוּ בִּדַּכּ?",
    words: [
      { ar: "كلو", he: "כולם", translit: "kullo" },
      { ar: "بيسأل", he: "שואלים", translit: "byis'al" },
      { ar: "شو", he: "מה", translit: "shu" },
      { ar: "بدك", he: "אתה רוצה", translit: "biddak" },
    ],
  },
  {
    line: "וַאַנַא דַוַּחְ'נִי אִלְגַ'מַאל",
    words: [
      { ar: "وأنا", he: "ואותי", translit: "wa-ana" },
      { ar: "دوخني", he: "סחרחר אותי", translit: "dawwakhni" },
      { ar: "الجمال", he: "היופי", translit: "il-jamal" },
    ],
  },
  {
    line: "אִסְמַע, אִסְמַע, אִסְמַע, אִסְמַע, אִסְמַע, אִסְמַע",
    words: [
      { ar: "اسمع", he: "תקשיב", translit: "isma'" },
    ],
  },
  {
    line: "בִּדִּי אַנַא שׁוּ בִּדִּי? אַנַא עֵ'ירַכּ מַא בִּדִּי",
    words: [
      { ar: "بدي", he: "אני רוצה", translit: "biddi" },
      { ar: "أنا", he: "אני", translit: "ana" },
      { ar: "شو", he: "מה", translit: "shu" },
      { ar: "غيرك", he: "חוץ ממך", translit: "ghayrak" },
      { ar: "ما", he: "לא", translit: "ma" },
    ],
  },
  {
    line: "שׁוּ מַהְצ'וּמֵה יַא חֻבִּי, יַא עֻמְרִי חַ'לִּיכּ חַדִּי",
    words: [
      { ar: "شو", he: "כמה", translit: "shu" },
      { ar: "محضومة", he: "חמודה/מתוקה", translit: "maH'ume" },
      { ar: "يا حبي", he: "יא אהובי", translit: "ya Hubbi" },
      { ar: "يا عمري", he: "יא חיי", translit: "ya 'umri" },
      { ar: "خليك", he: "תישאר", translit: "khallik" },
      { ar: "حدي", he: "לידי", translit: "Haddi" },
    ],
  },
  {
    line: "בִּדִּי אַנַא שׁוּ בִּדִּי? אַנַא עֵ'ירַכּ מַא בִּדִּי",
    words: [
      { ar: "بدي", he: "אני רוצה", translit: "biddi" },
      { ar: "أنا", he: "אני", translit: "ana" },
      { ar: "شو", he: "מה", translit: "shu" },
      { ar: "غيرك", he: "חוץ ממך", translit: "ghayrak" },
      { ar: "ما", he: "לא", translit: "ma" },
    ],
  },
  {
    line: "שׁוּ מַהְצ'וּמֵה יַא חֻבִּי, יַא עֻמְרִי חַ'לִּיכּ חַדִּי",
    words: [
      { ar: "شو", he: "כמה", translit: "shu" },
      { ar: "محضومة", he: "חמודה/מתוקה", translit: "maH'ume" },
      { ar: "يا حبي", he: "יא אהובי", translit: "ya Hubbi" },
      { ar: "يا عمري", he: "יא חיי", translit: "ya 'umri" },
      { ar: "خليك حدي", he: "תישאר לידי", translit: "khallik Haddi" },
    ],
  },
  {
    line: "יַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא",
    words: [
      { ar: "يما", he: "אמא'לה (קריאת התלהבות)", translit: "yamma" },
    ],
  },
  {
    line: "וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא",
    words: [
      { ar: "ويما", he: "ואמא'לה", translit: "w-yamma" },
    ],
  },
  {
    line: "וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא",
    words: [
      { ar: "ويما", he: "ואמא'לה", translit: "w-yamma" },
    ],
  },
  {
    line: "וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא, וִּיַמַּא",
    words: [
      { ar: "ويما", he: "ואמא'לה", translit: "w-yamma" },
    ],
  },
  {
    line: "מֻמְכִּן עַצִיר בִּאלְלַיְמוּן, מוּ מְצַדֵּק הַאלְעְיוּן",
    words: [
      { ar: "ممكن", he: "אפשר", translit: "mumkin" },
      { ar: "عصير بالليمون", he: "מיץ לימון", translit: "'aseer billaymun" },
      { ar: "مو", he: "לא", translit: "mu" },
      { ar: "مصدق", he: "מאמין", translit: "msaddaq" },
      { ar: "هالعيون", he: "העיניים האלה", translit: "hal-'uyun" },
    ],
  },
  {
    line: "גַ'אוַּבַּתְנִי פִי אִלְתֵלֵפוֹן, יַא וֵילִי צַאיֵר מַגְ'נוּן",
    words: [
      { ar: "جاوبتني", he: "היא ענתה לי", translit: "jawwabatni" },
      { ar: "في التليفون", he: "בטלפון", translit: "fil-telefon" },
      { ar: "يا ويلي", he: "אוי לי", translit: "ya weyli" },
      { ar: "صاير", he: "נהייתי", translit: "saayer" },
      { ar: "مجنون", he: "משוגע", translit: "majnun" },
    ],
  },
  {
    line: "סַלֵּמְלִי עַ-שַּׁבַּאבּ, וִּאִלִּי גַ'אי וִּאִלִּי עַ'אבּ",
    words: [
      { ar: "سلملي", he: "תמסור ד\"ש", translit: "sallemli" },
      { ar: "عالشباب", he: "לחבר'ה", translit: "'a-shabab" },
      { ar: "اللي جاي", he: "למי שבא", translit: "illi jay" },
      { ar: "اللي غاب", he: "למי שנעדר", translit: "illi ghab" },
    ],
  },
  {
    line: "חַבִּיבְּתִי אִלְצַ'מַא, קַלְבִּי אַנַא קַלְבִּי צַ'אע",
    words: [
      { ar: "حبيبتي", he: "אהובתי", translit: "Habibti" },
      { ar: "الضما", he: "הצמא", translit: "id-D'ama" },
      { ar: "قلبي", he: "הלב שלי", translit: "qalbi" },
      { ar: "ضاع", he: "אבד", translit: "D'a'" },
    ],
  },
  {
    line: "גַ'וַּאל, גַ'וַּאל, גַ'וַּאל, גַ'וַּאל",
    words: [
      { ar: "جوال", he: "נייד/סלולרי", translit: "jawwal" },
    ],
  },
  {
    line: "גַ'וַּאל, גַ'וַּאל, גַ'וַּאל, גַ'וַּאל, גַ'וַּאל",
    words: [
      { ar: "جوال", he: "נייד/סלולרי", translit: "jawwal" },
    ],
  },
  {
    line: "בִּדִּי אַנַא שׁוּ בִּדִּי? אַנַא עֵ'ירַכּ מַא בִּדִּי",
    words: [
      { ar: "بدي", he: "אני רוצה", translit: "biddi" },
      { ar: "أنا", he: "אני", translit: "ana" },
      { ar: "شو", he: "מה", translit: "shu" },
      { ar: "غيرك", he: "חוץ ממך", translit: "ghayrak" },
      { ar: "ما", he: "לא", translit: "ma" },
    ],
  },
  {
    line: "שׁוּ מַהְצ'וּמֵה יַא חֻבִּי, יַא עֻמְרִי חַ'לִּיכּ חַדִּי",
    words: [
      { ar: "شو", he: "כמה", translit: "shu" },
      { ar: "محضومة", he: "חמודה/מתוקה", translit: "maH'ume" },
      { ar: "يا حبي", he: "יא אהובי", translit: "ya Hubbi" },
      { ar: "يا عمري", he: "יא חיי", translit: "ya 'umri" },
      { ar: "خليك حدي", he: "תישאר לידי", translit: "khallik Haddi" },
    ],
  },
];

async function main() {
  const { data: song } = await s
    .from("songs")
    .select("id, title")
    .eq("title", "YAMA")
    .maybeSingle();

  if (!song) { console.error("YAMA song not found"); process.exit(1); }

  const { error } = await s
    .from("songs")
    .update({ lyrics_parsed: LYRICS_PARSED })
    .eq("id", song.id);

  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Updated YAMA (${song.id}) with ${LYRICS_PARSED.length} lines`);
}

main().catch((e) => { console.error(e); process.exit(1); });
