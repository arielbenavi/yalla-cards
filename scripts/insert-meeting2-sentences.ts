/**
 * Inserts meeting 2 translation sentences as:
 * 1. A paradigm object (meeting=2, slug='sentences_translation')
 * 2. Individual sentence cards in שיעור 2
 * Transliterations verified by chatifai.
 * Run: npx tsx scripts/insert-meeting2-sentences.ts
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

const sentences = [
  { num: 1,  he: "זה מקלט ביתנו וקטן והוא ישן",                                            translit: "הַאדַא מַלְגַ'א בֵּיתְנַא וְהֻוֵּ זְעִ'יר וְקַדִים",                                                             ar: "هذا ملجأ بيتنا وهو صغير وقديم" },
  { num: 2,  he: "זה מסגד השכונה והוא גדול וחדש",                                           translit: "הַאדַא מַסְגֵ'ד (א)לְחַארָה וְהֻוֵּ כְּבִּיר וְגְ'דִיד",                                                          ar: "هذا مسجد الحارة وهو كبير وجديد" },
  { num: 3,  he: "אשתי עבודתה בבניין הזה",                                                  translit: "מַרָתִי שֻׁעְ'לְהָא פִי הַ(א)לְעַמַּארָה",                                                                        ar: "مرتي شغلها في هالعمارة" },
  { num: 4,  he: "מקום עבודתו ליד היישוב",                                                  translit: "מַחַל שֻׁעְ'לוֹ גַ'מְבּ (א)לְבַּלַד",                                                                             ar: "محل شغله جنب البلد" },
  { num: 5,  he: "זאת לא בעייתך ולא בעייתי, זאת בעייתם!",                                  translit: "הַאדִי מֻשׁ מֻשְׁכִּלְתַּכּ וְמֻשׁ מֻשְׁכִּלְתִּי, הַאדִי מֻשְׁכִּלְתְּהֹם",                                       ar: "هادي مش مشكلتك ومش مشكلتي، هادي مشكلتهم" },
  { num: 6,  he: "יש מחסנים במרפסת בבניין ההוא",                                            translit: "פִי מַחַ'אזֵן בִּ(א)לְבַּלְכּוֹנֵה פִי הַדִיכִּ (א)לְעַמַּארָה",                                               ar: "في مخازن بالبلكونة في هذيك العمارة" },
  { num: 7,  he: "איפה היא גרה? ליד הפרדסים?",                                              translit: "וֵין הִיֵ סַאכְּנֵה? גַ'מְבּ (א)לְבַּיַּארַאת?",                                                                  ar: "وين هي ساكنة؟ جنب البيارات؟" },
  { num: 8,  he: "הכפרים באזורכם עתיקים",                                                   translit: "(א)לְקֻרַא פִי מִנְטַקַּתְכֹם עֻתֻּק",                                                                            ar: "القرى في منطقتكم عتق" },
  { num: 9,  he: "המכנסיים והנעליים והחולצות האלו, בארון בחדר ההוא",                        translit: "(א)לְבַּנְטַלוֹן וִ(א)לְכֻּנְדָּרָה וִ(א)לְקֻמְצַאן הַדוֹל, בִּ(א)לְחַ'זַּאנֵה בְּהַדִיכִּ (א)לְעֻ'רְפֵּה",      ar: "البنطلون والكنادرة والقمصان هذول، بالخزانة بهذيك الغرفة" },
  { num: 10, he: "לא שעה ולא דקה, שניות",                                                   translit: "לַא (מֻשׁ) סֵיעַה וְלַא (וְמֻשׁ) דְּקִיקַה, תַּוַאנִי",                                                           ar: "لا (مش) ساعة ولا (ومش) دقيقة، ثواني" },
  { num: 11, he: "ספריית העיר גדולה וחדשה",                                                 translit: "מַכְּתַבַּת (א)לְמַדִינֵה כְּבִּירֵה וִגְ'דִידֵה",                                                               ar: "مكتبة المدينة كبيرة وجديدة" },
  { num: 12, he: "אני גר ברחוב הפרדס ליד מסגד היישוב",                                     translit: "אַנָא סַאכֵּן פִי שַׁארֻעַ (א)לְבַּיַּארָה גַ'מְבּ מַסְגֵ'ד (א)לְבַּלַד",                                        ar: "أنا ساكن في شارع البيارة جنب مسجد البلد" },
  { num: 13, he: "הוא גר ברחובי ועבודתו בשדה התעופה",                                       translit: "הֻוֵּ סַאכֵּן פִי שַׁארֻעִי וְשֻׁעְ'לוֹ בִּ(א)לְמַטַּאר",                                                        ar: "هو ساكن في شارعي وشغله بالمطار" },
  { num: 14, he: "את גרה ליד הספריה ואתם גרים ליד משרדי ליד הכפר ההוא",                    translit: "אִנְתִּי סַאכְּנֵה גַ'מְבּ (א)לְמַכְּתַבֵּה וְאִנְתוּ סַאכְּנִין גַ'מְבּ מַכְּתַבִּי בִּהַדִיכִּ (א)לְקַרְיֵה",  ar: "إنتي ساكنة جنب المكتبة وإنتو ساكنين جنب مكتبي بهذيك القرية" },
  { num: 15, he: "המחשב החדש במשרדי ליד חלון המרפסת",                                       translit: "(א)לְכַּמְבְּיוֹתֵר (א)לְגְ'דִיד פִי מַכְּתַבִּי גַ'מְבּ שֻׁבַּּאכּ (א)לְבַּלְכּוֹנֵה",                        ar: "الكمبيوتر الجديد في مكتبي جنب شباك البلكونة" },
  { num: 16, he: "בעלה של אימי גם הוא גר בבית",                                             translit: "גוֹז אִמִּי כַּמַאן הֻוֵּ סַאכֵּן בִּ(א)לְבֵּית",                                                                  ar: "جوز أمي كمان هو ساكن بالبيت" },
  { num: 17, he: "זאת התשובה! עוד שאלה?",                                                   translit: "הַאדַא (א)לְגַ'וַּאב! כַּמַאן סֻאַאל?",                                                                          ar: "هذا الجواب! كمان سؤال؟" },
  { num: 18, he: "זה מטבח הבית וזאת המקלחת ואלו החדרים",                                   translit: "הַאדַא מַטְבַּח (א)לְבֵּית וְהַאדַא (א)לְחַמַּאם וְהַדוֹל (א)לְעֻ'רַף",                                         ar: "هذا مطبخ البيت وهذا الحمام وهذول الغرف" },
  { num: 19, he: "זאת תקרת המשרד",                                                          translit: "הַאדַא סַקְף (א)לְמַכְּתַב",                                                                                      ar: "هذا سقف المكتب" },
  { num: 20, he: "יש נשים וגם גברים, משפחות גדולות",                                       translit: "פִי נִסְוַאן וְכַּמַאן רְגַ'אל, עֵילַאת כְּבַּאר",                                                                ar: "في نسوان وكمان رجال، عيلات كبار" },
];

function strip(s: string) {
  return s.replace(/[֑-ׇ]/g, "").trim();
}

async function main() {
  const paradigmData = {
    description: "משפטים לתרגום מעברית לערבית — מפגש 2",
    lines: sentences.map((s) => ({ num: s.num, he: s.he, translit: s.translit, ar: s.ar })),
  };

  const { error: pErr } = await sb
    .from("paradigms")
    .upsert({ meeting: 2, slug: "sentences_translation", data: paradigmData }, { onConflict: "meeting,slug" });
  if (pErr) { console.error("paradigm upsert error:", pErr); return; }
  console.log("✓ paradigm upserted (meeting=2, slug=sentences_translation)");

  const { data: existing } = await sb
    .from("cards")
    .select("translit_nikud")
    .eq("item_type", "sentence")
    .eq("lesson_id", LESSON_ID);

  const existingSet = new Set((existing ?? []).map((c: any) => strip(c.translit_nikud)));

  const toInsert = sentences
    .filter((s) => !existingSet.has(strip(s.translit)))
    .map((s) => ({
      lesson_id: LESSON_ID,
      hebrew_meaning: s.he,
      translit_nikud: s.translit,
      arabic_script: s.ar,
      item_type: "sentence",
      chatifai_verified: true,
    }));

  if (toInsert.length === 0) {
    console.log("no new sentence cards to insert");
    return;
  }

  const { data, error: cErr } = await sb.from("cards").insert(toInsert).select("id");
  if (cErr) { console.error("cards insert error:", cErr); return; }
  console.log(`✓ inserted ${data?.length} sentence cards`);
  for (const s of sentences) {
    console.log(`  ${existingSet.has(strip(s.translit)) ? "skip" : "NEW "} ${s.num}. ${s.he}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
