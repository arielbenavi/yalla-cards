// Book p. 51 (מפגש 4, prepositions of place): the example sentences and the three
// words that had no card (Ariel, 2026-10-24). Read off the page image; chatifai
// checked every line — ten תקין; it wanted אִלְמְעַלֵּם in line 11, but the page
// prints לִמְעַלֵּם, so the book's form stays and chatifai's is in the note.
//
//   npx tsx scripts/insert-book-p51.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const L4 = "f92adfb7-cf83-4a08-910d-0f82fa7025da"; // מפגש 4

const CARDS: { tr: string; ar: string; he: string; type: string; note?: string }[] = [
  { tr: "וַרַא (א)לְבֵּית פִי סַיַּארַה", ar: "ورا البيت في سيارة", he: "מאחורי הבית יש מכונית", type: "sentence" },
  { tr: "קֻדַּאמִ (א)לְמַדְרַסֵה פִי רַוְצַ'ת אַטְפַאל", ar: "قدام المدرسة في روضة أطفال", he: "מול בית הספר יש גן ילדים", type: "sentence" },
  { tr: "בֵּיתְהֹם קְבַּאל בֵּיתְהַא", ar: "بيتهم قبال بيتها", he: "ביתם מול ביתה", type: "sentence" },
  { tr: "מַכְּתַבּ סִידִי גַ'מְבּ בֵּיתְנַא", ar: "مكتب سيدي جنب بيتنا", he: "המשרד של סבא שלי ליד הבית שלנו", type: "sentence" },
  { tr: "תַחְתִ (א)לְעַמַארַה פִי דַכַּאכִּין כְּתַאר", ar: "تحت العمارة في دكاكين كثار", he: "מתחת לבניין יש הרבה חנויות", type: "sentence" },
  { tr: "אִ(ל)שַּנְטַה פוֹקִ (א)לְחַ'זַאנֵה", ar: "الشنطة فوق الخزانة", he: "התיק / המזוודה מעל הארון", type: "sentence" },
  { tr: "חַוַאלִי סֵיעַה וְנֻצּ", ar: "حوالي ساعة ونص", he: "בערך שעה וחצי", type: "phrase" },
  { tr: "פִי הוֹן אַבּוּ כִּילוֹ בַּנְדוֹרַה", ar: "في هون أبو كيلو بندورة", he: "יש פה בערך קילו עגבניות", type: "sentence", note: "אַבּוּ = בערך" },
  { tr: "אִלְוַלַד מֻש הוֹן", ar: "الولد مش هون", he: "הילד לא פה", type: "sentence" },
  { tr: "אִלְבִּנֵת הֻנַאכּ", ar: "البنت هناك", he: "הבת שם", type: "sentence" },
  { tr: "לִמְעַלֵּם מַוְג'וּד בַּרַּא", ar: "المعلم موجود برا", he: "המורה / האחראי נמצא בחוץ", type: "sentence", note: "chatifai: אִלְמְעַלֵּם" },
  { tr: "אַטְפַאל", ar: "أطفال", he: "ילדים", type: "word", note: "רַוְצַ'ת אַטְפַאל = גן ילדים" },
  { tr: "סִידִי", ar: "سيدي", he: "סבא שלי", type: "word" },
  { tr: "דַכַּאכִּין", ar: "دكاكين", he: "חנויות", type: "word", note: "יחיד: דֻכַּאן" },
];

async function main() {
  for (const c of CARDS) console.log(c.tr, "·", c.he);
  if (!APPLY) return console.log("dry run — add --apply");
  const { data, error } = await sb
    .from("cards")
    .insert(CARDS.map((c) => ({
      translit_nikud: c.tr, arabic_script: c.ar, hebrew_meaning: c.he, item_type: c.type,
      notes: ["ספר המדרשה עמ׳ 51", c.note].filter(Boolean).join(" · "),
      lesson_id: L4, course_verified: true, chatifai_verified: true,
    })))
    .select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "cards");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
