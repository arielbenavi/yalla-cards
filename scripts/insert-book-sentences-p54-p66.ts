// Sentences Ariel picked as cards (2026-10-24): p. 54 nos. 2, 6, 10, 11 (translation
// p. 55) and pp. 66–67 nos. 1, 8, 11, 14, 15, 19 (answers pp. 296–297). Book pointing,
// read off the images; chatifai checked them. p. 54-6: chatifai wanted תַבַּעְנַא, but the
// page prints תַבַּעְתְנַא — the book's form stays, chatifai's is in the note.
// Into מילים שביקשתי so they reach the daily queue.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const C = (page: string, tr: string, ar: string, he: string, note?: string) => ({ page, tr, ar, he, note });
const CARDS = [
  C("54", "אִ(ל)שַּאחְנֵה תַעוֹ פִי (אל)שַּארֵע קֻדַּאם בֵּיתִי", "الشاحنة تعو في الشارع قدام بيتي", "המשאית שלו ברחוב מול הבית שלי"),
  C("54", "אִ(ל)טַּאוְלֵה תַבַּעְתְנַא קְבַּאל (אל)שֻּבַּאכּ תַבַּעְהַא", "الطاولة تبعتنا قبال الشباك تبعها", "השולחן שלנו מול החלון שלה", "chatifai: תַבַּעְנַא"),
  C("54", "רַוְצַ'ת (א)לְאַטְפַאל תַע בִּנְתִי, פִי וַרַאהַא מַוְקֵף סַיַּארַאת", "روضة الأطفال تع بنتي، في وراها موقف سيارات", "לגן הילדים של הבת שלי יש מאחוריו חניון מכוניות"),
  C("54", "קֻדַּאם דַוַּאר (א)לְבַּלַד הֻנַאכּ פִי רַמְזוֹן", "قدام دوار البلد هناك في رمزون", "מול כיכר היישוב יש שם רמזור"),
  C("296", "אִ(ל)שַּארֵע (א)לְיוֹם פַאצִ'י פִשּ פִיּוֹ נַאס", "الشارع اليوم فاضي فش فيه ناس", "הרחוב היום ריק, אין בו אנשים", "גם: מַפִיש / מַפִשּ / מַא פִי"),
  C("296", "עַ מַדְחַ'ל (א)לְבַּלַד פִי מַוְקַף סַיַּארַאת אַמַּא פִש פִיּוֹ מַחַלּ בְּ(א)לְמַרַּה", "ع مدخل البلد في موقف سيارات أما فش فيه محل بالمرة", "בכניסה ליישוב יש חניון מכוניות, אבל אין בו מקום בכלל", "גם: מַפִיש במקום פִש"),
  C("296", "עַדַד (א)לְאַטְפַאל הוֹן פִי (א)לְמַדִינֵה טַאלֵע יוֹם בַּעַד יוֹם", "عدد الأطفال هون في المدينة طالع يوم بعد يوم", "מספר הפעוטות פה בעיר עולה יום אחרי יום"),
  C("297", "פִי נֻצּ (אל)טַּרִיק פִי עַאמוּד וְבַּעְדוֹ פִי נַזְלֵה זְעִ'ירֵה", "في نص الطريق في عامود وبعده في نزلة زغيرة", "בחצי הדרך יש עמוד, ואחריו יש ירידה קטנה"),
  C("297", "קַבְּל (אל)שּוֹכֵּה פִי טַלְעַה כְּבִּירֵה פִש מִתֵלְהַא", "قبل الشوكة في طلعة كبيرة فش متلها", "לפני הפיצול יש עלייה גדולה, אין כמוה"),
  C("297", "בְּ(אל)לֵּיל פִי עַתְמֵה יַעְנִי מַפִיש צַ'וְ בְּ(א)לְמַרַּה", "بالليل في عتمة يعني ما فيش ضو بالمرة", "בלילה יש חושך, יעני אין אור בכלל"),
];
(async () => {
  const { data, error } = await sb.from("cards").insert(CARDS.map((c) => ({
    translit_nikud: c.tr, arabic_script: c.ar, hebrew_meaning: c.he, item_type: "sentence",
    notes: [`ספר המדרשה עמ׳ ${c.page}`, c.note].filter(Boolean).join(" · "),
    lesson_id: ASKED, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "sentence cards");
})();
