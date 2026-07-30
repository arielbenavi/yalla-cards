/**
 * Inserts meeting 2 oral vocabulary as word cards in שיעור 2.
 * Nikud verified by chatifai. Some corrections applied:
 *   - #12 "רוחמה/לקחתי" → chatifai: רוּחְנַא/הלכנו
 *   - #40 "אנא אל עקל" → chatifai: עַלַא אִלְאַאַל (PA: على الأقل)
 *   - #57 "אנא מחלק" → chatifai: עַלַא מַהְלַכּ (على مهلك)
 * Run: npx tsx scripts/insert-meeting2-oral-vocab.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const LESSON_ID = "5325a7b7-82e9-446c-ac41-d913690d52dd"; // שיעור 2

function strip(s: string) {
  return s.replace(/[֑-ׇ]/g, "").trim();
}

const words: Array<{ he: string; translit: string; ar: string }> = [
  { he: "איך אתה היום?", translit: "כִּיפַאכּ אִלְיוֹם", ar: "كيفاك اليوم" },
  { he: "טוב / בסדר", translit: "מְנִיח", ar: "مناح" },
  { he: "תשלים / תסיים / תמשיך", translit: "כַּמֵּל", ar: "كمّل" },
  { he: "קשה", translit: "צַעֵבּ", ar: "صعب" },
  { he: "קל", translit: "סַהֵל", ar: "سهل" },
  { he: "יפה / מתוק / כל הכבוד", translit: "חִלוּ", ar: "حلو" },
  { he: "המצב שלי", translit: "חַאלִי", ar: "حالي" },
  { he: "דוד (אחי האם)", translit: "חַ'אלִי", ar: "خالي" },
  { he: "דודה (אחות האם)", translit: "חַ'אלֵה", ar: "خالة" },
  { he: "לחזור / חזור (ציווי)", translit: "אַרְגַ'ע", ar: "ارجع" },
  { he: "חזרתי", translit: "רִגִ'עֵת", ar: "رجعت" },
  { he: "הלכנו", translit: "רוּחְנַא", ar: "رحنا" },
  { he: "רישוי / רישיון", translit: "תַרְחִ'יצ", ar: "ترخيص" },
  { he: "חדשות (רבים)", translit: "אַחְ'בַּאר", ar: "أخبار" },
  { he: "ידיעה / חדשה (יחיד)", translit: "חַ'בַּר", ar: "خبر" },
  { he: "איפה היית?", translit: "וֵין כֻּנְת?", ar: "وين كنت؟" },
  { he: "חופשת הקיץ", translit: "אִלְעֻטְלֵה אִלְצֵיפִיֵּה", ar: "العطلة الصيفية" },
  { he: "או שעדיין לא", translit: "וִלַא לִסַּא", ar: "ولا لسا" },
  { he: "נכון (קיצור של صحيح)", translit: "צַח", ar: "صح" },
  { he: "דמות / אדם מסוים", translit: "שַחְ'צ מֻעַיַּן", ar: "شخص معين" },
  { he: "אישיות", translit: "שַחְ'צִיֵּה", ar: "شخصية" },
  { he: "שחקן טלוויזיה", translit: "מֻמַסֵּ'ל תִלְפִזְיוֹן", ar: "ممثل تلفزيون" },
  { he: "הצדק / האמת איתך", translit: "אִלְחַאּ' מַעַכּ", ar: "الحق معك" },
  { he: "תוכנית (טלוויזיה)", translit: "בַּרְנַאמֵג'", ar: "برنامج" },
  { he: "סרט", translit: "פִילֵם", ar: "فيلم" },
  { he: "עברית (שפה)", translit: "עִבְּרַאנִי", ar: "عبراني" },
  { he: "דמיוני / בדיוני", translit: "חַ'יַאלִי", ar: "خيالي" },
  { he: "אמיתי", translit: "חַקִּיקִי", ar: "حقيقي" },
  { he: "אני לא יודע", translit: "אַנַא בַּעְרִפְשׁ", ar: "أنا بعرفش" },
  { he: "ידוע / מוכר", translit: "מַעְרוּף", ar: "معروف" },
  { he: "מת", translit: "מַיֵּת", ar: "ميت" },
  { he: "לבן (צבע)", translit: "אַבְּיַצ'", ar: "أبيض" },
  { he: "עם / אומה", translit: "שַעֵבּ", ar: "شعب" },
  { he: "כל העם אוהב אותו", translit: "כֻּל אִלְשַעֵבּ בִּחִבּוֹ", ar: "كل الشعب بحبو" },
  { he: "חושב / זוכר", translit: "פַאכֵּר", ar: "فاكر" },
  { he: "זמר", translit: "מֻעַ'נִּי", ar: "مغني" },
  { he: "קצין / מנהיג", translit: "עַאִ'יד", ar: "عقيد" },
  { he: "אף פעם", translit: "וַלַא מַרַּה", ar: "ولا مرة" },
  { he: "פעם ראשונה", translit: "אַוַּל מַרַּה", ar: "أول مرة" },
  { he: "לפחות", translit: "עַלַא אִלְאַאַל", ar: "على الأقل" },
  { he: "פוליטיקה", translit: "סִיַאסֵה", ar: "سياسة" },
  { he: "כבש (רבים: חירפאן)", translit: "חַ'רוּף", ar: "خروف" },
  { he: "מהמם / משגע", translit: "בִּגַ'נֵּן", ar: "بجنن" },
  { he: "ערבוב / מבולגן", translit: "מַחְ'לוּטַה", ar: "مخلوطة" },
  { he: "תחביב", translit: "הִוַאיֵה", ar: "هواية" },
  { he: "ביחד", translit: "מַע בַּעַצ'", ar: "مع بعض" },
  { he: "לפני הצבא", translit: "אַבְּל אִלְגֵ'יש", ar: "قبل الجيش" },
  { he: "קבוצה / צוות", translit: "פַרִיק", ar: "فريق" },
  { he: "איזה", translit: "אַי", ar: "أي" },
  { he: "ינצח / לנצח", translit: "יְפוּז", ar: "يفوز" },
  { he: "בכנות / האמת היא ש...", translit: "צַרַאחַה", ar: "صراحة" },
  { he: "בגלל / בשביל", translit: "מִנְשַׁאן / עַשַׁאן", ar: "منشان / عشان" },
  { he: "משחק", translit: "לֻעְבֵּה", ar: "لعبة" },
  { he: "אני אגיד לך", translit: "אַחְכִּי-לַכּ", ar: "احكيلك" },
  { he: "הם מדברים", translit: "בִּחְכּוּ", ar: "بحكو" },
  { he: "חשוב", translit: "מֻהִמּ", ar: "مهم" },
  { he: "בנחת / לאט לך", translit: "עַלַא מַהְלַכּ", ar: "على مهلك" },
  { he: "כדורסל", translit: "כֻּרַת סַלַּה", ar: "كرة سلة" },
  { he: "אני אוהב", translit: "בַּחִבּ", ar: "بحب" },
  { he: "אחים", translit: "אִחְ'וֵה", ar: "إخوة" },
  { he: "אתה/היא אוהב/ת", translit: "בִּתְחִבּ", ar: "بتحب" },
  { he: "הודי / מהודו", translit: "הִנְדִי", ar: "هندي" },
  { he: "נגמר השיעור", translit: "חַ'לַץ אִלְדַּרְס", ar: "خلص الدرس" },
  { he: "רטוב", translit: "מַבְּלוּל", ar: "مبلول" },
];

async function main() {
  const { data: existing } = await sb
    .from("cards")
    .select("translit_nikud")
    .eq("item_type", "word")
    .eq("lesson_id", LESSON_ID);

  const existingSet = new Set((existing ?? []).map((c: any) => strip(c.translit_nikud)));

  const toInsert = words
    .filter((w) => !existingSet.has(strip(w.translit)))
    .map((w) => ({
      lesson_id: LESSON_ID,
      hebrew_meaning: w.he,
      translit_nikud: w.translit,
      arabic_script: w.ar,
      item_type: "word",
      chatifai_verified: true,
    }));

  if (toInsert.length === 0) {
    console.log("no new word cards to insert (all already exist)");
    return;
  }

  const { data, error } = await sb.from("cards").insert(toInsert).select("id");
  if (error) { console.error("insert error:", error); return; }
  console.log(`✓ inserted ${data?.length} word cards into שיעור 2`);
  for (const w of words) {
    console.log(`  ${existingSet.has(strip(w.translit)) ? "skip" : "NEW "} ${w.translit} = ${w.he}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
