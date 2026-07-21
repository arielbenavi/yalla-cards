/**
 * Updates YAMA lyrics_parsed with the precise Hebrew transliteration from chatifai.
 * Run: npx tsx scripts/update-yama-lyrics.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import type { LyricLine } from "@/app/api/songs/route";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const parsed: LyricLine[] = [
  { line: "כֻּלּוֹ בִּיִסְאַל: שׁוּ בִּדַּכּ?", words: [
    { ar: "كله", he: "כולם", translit: "kullo" },
    { ar: "بيسأل", he: "שואלים", translit: "biyis'al" },
    { ar: "شو", he: "מה", translit: "shu" },
    { ar: "بدك", he: "אתה רוצה", translit: "biddak" },
  ]},
  { line: "וַאַנַא דַוַּחְ'נִי אִלְגַ'מַאל", words: [
    { ar: "وأنا", he: "ואותי", translit: "wa-ana" },
    { ar: "دوّخني", he: "סחרחר", translit: "dawwakhni" },
    { ar: "الجمال", he: "היופי", translit: "il-jamal" },
  ]},
  { line: "אִסְמַע, אִסְמַע, אִסְמַע", words: [
    { ar: "اسمع", he: "תקשיב", translit: "isma'" },
  ]},
  { line: "בִּדִּי אַנַא שׁוּ בִּדִּי? אַנַא עֵ'ירַכּ מַא בִּדִּי", words: [
    { ar: "بدي", he: "אני רוצה", translit: "biddi" },
    { ar: "أنا", he: "אני", translit: "ana" },
    { ar: "شو", he: "מה", translit: "shu" },
    { ar: "بدي", he: "רוצה", translit: "biddi" },
    { ar: "أنا", he: "אני", translit: "ana" },
    { ar: "غيرك", he: "מלבדך", translit: "gheyrak" },
    { ar: "ما", he: "לא", translit: "ma" },
    { ar: "بدي", he: "רוצה", translit: "biddi" },
  ]},
  { line: "שׁוּ מַהְצ'וּמֵה יַא חֻבִּי, יַא עֻמְרִי חַ'לִּיכּ חַדִּי", words: [
    { ar: "شو", he: "כמה", translit: "shu" },
    { ar: "مهضومة", he: "חמודה", translit: "mahDuma" },
    { ar: "يا", he: "יא", translit: "ya" },
    { ar: "حبي", he: "אהובתי", translit: "Hubbi" },
    { ar: "يا", he: "יא", translit: "ya" },
    { ar: "عمري", he: "חיי", translit: "'umri" },
    { ar: "خليك", he: "תישאר/י", translit: "khallik" },
    { ar: "حدي", he: "לידי", translit: "Haddi" },
  ]},
  { line: "יַמַּא, יַמַּא, יַמַּא יַמַּא יַמַּא", words: [
    { ar: "ياما", he: "יא אמא'לה (קריאת התלהבות)", translit: "yamma" },
  ]},
  { line: "מֻמְכִּן עַצִיר בִּאלְלַיְמוּן, מוּ מְצַדֵּק הַאלְעְיוּן", words: [
    { ar: "ممكن", he: "אפשר", translit: "mumkin" },
    { ar: "أعصر", he: "מיץ", translit: "'aseer" },
    { ar: "بالليمون", he: "בלימון", translit: "bil-laymun" },
    { ar: "مو", he: "לא", translit: "mu" },
    { ar: "مصدق", he: "מאמין", translit: "msaddiq" },
    { ar: "هالعيون", he: "לעיניים האלה", translit: "hal-'uyun" },
  ]},
  { line: "גַ'אוַּבַּתְנִי פִי אִלְתֵלֵפוֹן, יַא וֵילִי צַאיֵר מַגְ'נוּן", words: [
    { ar: "جاوبتني", he: "ענתה לי", translit: "jawwabatni" },
    { ar: "في", he: "ב", translit: "fi" },
    { ar: "التلفون", he: "הטלפון", translit: "it-telefon" },
    { ar: "يا ويلي", he: "אוי לי", translit: "ya weyli" },
    { ar: "صاير", he: "נהייתי", translit: "saayer" },
    { ar: "مجنون", he: "משוגע", translit: "majnun" },
  ]},
  { line: "סַלֵּמְלִי עַ-שַּׁבַּאבּ, וִּאִלִּי גַ'אי וִּאִלִּי עַ'אבּ", words: [
    { ar: "سلّملي", he: "תמסור ד\"ש", translit: "sallemli" },
    { ar: "عالشباب", he: "לחבר'ה", translit: "'ash-shabab" },
    { ar: "واللي", he: "ולאלה ש", translit: "willi" },
    { ar: "جاي", he: "שבאו", translit: "jay" },
    { ar: "واللي", he: "ולאלה ש", translit: "willi" },
    { ar: "غاب", he: "נעדרו", translit: "ghab" },
  ]},
  { line: "חַבִּיבְּתִי אִלְצַ'מַא, קַלְבִּי אַנַא קַלְבִּי צַ'אע", words: [
    { ar: "حبيبتي", he: "אהובתי", translit: "Habibti" },
    { ar: "الضما", he: "הצמא", translit: "iD-Dama" },
    { ar: "قلبي", he: "הלב שלי", translit: "qalbi" },
    { ar: "أنا", he: "אני", translit: "ana" },
    { ar: "قلبي", he: "הלב שלי", translit: "qalbi" },
    { ar: "ضاع", he: "אבד", translit: "Da'" },
  ]},
  { line: "גַ'וַּאל, גַ'וַּאל, גַ'וַּאל", words: [
    { ar: "جوال", he: "נייד (טלפון סלולרי)", translit: "jawwal" },
  ]},
  { line: "הֶרְמֵס, לוּאִי וִיטוֹן", words: [
    { ar: "هيرميز", he: "הרמס", translit: "Hermes" },
    { ar: "لويس فيتون", he: "לואי ויטון", translit: "Louie Vuitton" },
  ]},
  { line: "מַצַארִי פִי אִלְכּוֹמְפְּט", words: [
    { ar: "مصاري", he: "כסף", translit: "maSari" },
    { ar: "في", he: "ב", translit: "fi" },
    { ar: "الكومبت", he: "החשבון", translit: "il-compte" },
  ]},
  { line: "אַלִף בִּכּ אִלְכּוֹן", words: [
    { ar: "ألفت", he: "הכרתי (אקיף)", translit: "alfat" },
    { ar: "بك", he: "בך", translit: "bik" },
    { ar: "الكون", he: "היקום", translit: "il-kon" },
  ]},
  { line: "אַחִבַּכּ דַאיֵם דוּם", words: [
    { ar: "بحبك", he: "אוהב אותך", translit: "baHibbak" },
    { ar: "دايم", he: "תמיד", translit: "dayem" },
    { ar: "دوم", he: "לתמיד", translit: "dum" },
  ]},
  { line: "חַבִּיבִּי יַא עֵינִי, חַבִּיבִּי יַא רוּחִי", words: [
    { ar: "حبيبي", he: "חביבי", translit: "Habibi" },
    { ar: "يا عيني", he: "יא עיני (יקיר לי כעיניי)", translit: "ya 'eyni" },
    { ar: "حبيبي", he: "חביבי", translit: "Habibi" },
    { ar: "يا روحي", he: "יא רוחי (נשמתי)", translit: "ya ruHi" },
  ]},
  { line: "יַא וַאחְ'ד מִנִּי רוּחִי, חַבִּיבִּי לַא תְרוּחִי", words: [
    { ar: "يا واخذ", he: "יא לוקח", translit: "ya wakhid" },
    { ar: "مني", he: "ממני", translit: "minni" },
    { ar: "روحي", he: "נשמתי", translit: "ruHi" },
    { ar: "حبيبي", he: "חביבי", translit: "Habibi" },
    { ar: "لا", he: "אל", translit: "la" },
    { ar: "تروحي", he: "תלכי", translit: "truHi" },
  ]},
];

async function main() {
  const { data: song } = await supabase
    .from("songs")
    .select("id")
    .eq("title", "YAMA")
    .eq("artist", "Dystinct")
    .maybeSingle();

  if (!song) { console.error("YAMA not found"); process.exit(1); }

  const { error } = await supabase
    .from("songs")
    .update({ lyrics_parsed: parsed })
    .eq("id", song.id);

  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Updated YAMA (${song.id}) with ${parsed.length} lines`);
}

main().catch((e) => { console.error(e); process.exit(1); });
