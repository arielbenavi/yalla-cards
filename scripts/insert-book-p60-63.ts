// Book מפגש 4: the dialogue on p. 60 (translation p. 61) and the vocabulary list on
// pp. 62–63 — whatever had no card (Ariel, 2026-10-24). Read off the page images;
// chatifai checked every line. Taken from its review where the image agrees:
// לַאַבּוֹ (d5), (א)לִתְרַכּ (d14), שֻוַכּ. Left as printed: its linking hiriqs, בִּ for
// the book's בְּ, and the מַאשִי it appended to d7 (that is the next line's first word).
//
//   npx tsx scripts/insert-book-p60-63.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const L4 = "f92adfb7-cf83-4a08-910d-0f82fa7025da";

type C = { tr: string; ar: string; he: string; type: string; page: number; note?: string };
const CARDS: C[] = [
  // dialogue
  { page: 60, type: "sentence", tr: "מַרְחַבְּתֵין יַא אִבְּנִי", ar: "مرحبتين يا ابني", he: "שלום רב בני" },
  { page: 60, type: "sentence", tr: "חַגֵּ'ה? דַארִ (א)לְחַ'טִיבּ סַאכְּנִין הוֹן בְּ(אל)שַּארֵע הַאד?", ar: "حجة؟ دار الخطيب ساكنين هون بالشارع هاد؟", he: "גברתי? משפחת אלח'טיב גרים פה ברחוב הזה?", note: "דַאר = כאן: משפחה, בני הבית" },
  { page: 60, type: "sentence", tr: "אַה וַאללַּה, פִי הוֹן דַארִ (א)לְחַ'טִיבּ, אַנוּ וַאחַד מִנְּהֹם בִּדַּכּ?", ar: "آه والله، في هون دار الخطيب، أنو واحد منهم بدك؟", he: "כן, יש פה משפחת אלח'טיב — איזה מהם אתה צריך?" },
  { page: 60, type: "sentence", tr: "אַנַא בִּדִּי וַלִיד אִבְּנוֹ לַאַבּוֹ צֻבְּחִי", ar: "أنا بدي وليد ابنه لأبو صبحي", he: "אני צריך את וליד, הבן של אבו צבחי" },
  { page: 60, type: "sentence", tr: "טַיֵּבּ, בַּסּ אִנְתֵ מְנֵין? אִנְתֵ מֻש מִנְּ (א)לְבַּלַד הוֹן, מַטְ'בּוּט?", ar: "طيب، بس إنت منين؟ إنت مش من البلد هون، مضبوط؟", he: "טוב, אבל אתה מאיפה? אתה לא מהיישוב פה, נכון?" },
  { page: 60, type: "sentence", tr: "לַא וַאללַּה, אַנַא סַאכֵּן פִי בִּיר (א)לְמַכְּסוּר, חַוַאלִי עַשַרַה כִּילוֹ מִנְּ הוֹן", ar: "لا والله، أنا ساكن في بير المكسور، حوالي عشرة كيلو من هون", he: "לא, אני גר בביר אלמכסור, בערך 10 קילומטר מכאן", note: "כִּילוֹ = כאן: קילומטרים" },
  { page: 60, type: "sentence", tr: "מַאשִי, וְאֵיש בִּדַּכּ מִנְּ אִבְּנוֹ לַאַבּוּ צֻבְּחִי?", ar: "ماشي، وإيش بدك من ابنه لأبو صبحي؟", he: "בסדר, ומה אתה צריך מהבן של אבו צבחי?" },
  { page: 60, type: "sentence", tr: "אַנַא וְוַלִיד טֻלַּאבּ פִי גַ'אמְעַת חֵיפַא", ar: "أنا ووليد طلاب في جامعة حيفا", he: "אני ווליד סטודנטים באוניברסיטת חיפה" },
  { page: 60, type: "sentence", tr: "הֵיכּ יַעְנִי, אִנְתֵ שַאיֵף (א)לְבִּנֵת אִלִּי תַחְת שַגַ'רַת (אל)זֵּיתוּן?", ar: "هيك يعني، إنت شايف البنت اللي تحت شجرة الزيتون؟", he: "ככה — אתה רואה את הילדה שמתחת לעץ הזית?" },
  { page: 60, type: "sentence", tr: "הַדִיכּ (א)לְבִּנֵת, אִלִּי קְבַּאל עַאמוּד (א)לְכַּהְרַבַּא?", ar: "هديك البنت، اللي قبال عامود الكهربا؟", he: "הילדה ההיא, שמול עמוד החשמל?" },
  { page: 60, type: "sentence", tr: "נַעַם, בַּעְדְהַא פִי תְרַכּ, שַאיְפוֹ?", ar: "نعم، بعدها في ترك، شايفه؟", he: "כן, אחריה יש משאית, רואה אותה?" },
  { page: 60, type: "sentence", tr: "אַה, אַנַא שַאיְפוֹ", ar: "آه، أنا شايفه", he: "כן, אני רואה אותה" },
  { page: 60, type: "sentence", tr: "אִלְבֵּית וַרַא (א)לִתְרַכּ, הַאדַא בֵּית דַארִ (א)לְחַ'טִיבּ", ar: "البيت ورا الترك، هادا بيت دار الخطيب", he: "הבית שמאחורי המשאית — זה הבית של משפחת אלח'טיב" },
  { page: 60, type: "sentence", tr: "תִסְלַמִי יַא חַגֵּ'ה, מַע (אל)סַּלַאמֵה", ar: "تسلمي يا حجة، مع السلامة", he: "תבורכי גבירתי, להתראות" },
  { page: 60, type: "sentence", tr: "אַללַּה יְסַלְּמַכּ יַא רוּחִי, בְּ(אל)נַּגַ'אח וְ(אל)תַּוְפִיק", ar: "الله يسلمك يا روحي، بالنجاح والتوفيق", he: "אלוהים ישמור עליך נשמתי, בהצלחה" },
  { page: 60, type: "phrase", tr: "בַּארַכּ אַללַּה פִיכִּי", ar: "بارك الله فيكي", he: "אלוהים יברך אותך (לאישה)" },
  // words from the dialogue
  { page: 60, type: "word", tr: "אִבְּנִי", ar: "ابني", he: "הבן שלי / בני (גם פנייה לצעיר)" },
  { page: 60, type: "phrase", tr: "דַארִ (א)לְחַ'טִיבּ", ar: "دار الخطيب", he: "משפחת אלח'טיב", note: "דַאר = בית, וגם: המשפחה / בני הבית" },
  { page: 60, type: "word", tr: "סַאכְּנִין", ar: "ساكنين", he: "גרים (ר)" },
  { page: 60, type: "phrase", tr: "וַאחַד מִנְּהֹם", ar: "واحد منهم", he: "אחד מהם" },
  { page: 60, type: "word", tr: "אִבְּנוֹ", ar: "ابنه", he: "הבן שלו" },
  { page: 60, type: "word", tr: "טֻלַּאבּ", ar: "طلاب", he: "סטודנטים / תלמידים" },
  { page: 60, type: "word", tr: "הֵיכּ", ar: "هيك", he: "ככה" },
  { page: 60, type: "word", tr: "יַעְנִי", ar: "يعني", he: "כלומר / יעני" },
  { page: 60, type: "phrase", tr: "שַגַ'רַת (אל)זֵּיתוּן", ar: "شجرة الزيتون", he: "עץ הזית" },
  { page: 60, type: "phrase", tr: "עַאמוּד (א)לְכַּהְרַבַּא", ar: "عامود الكهربا", he: "עמוד החשמל" },
  { page: 60, type: "word", tr: "נַעַם", ar: "نعم", he: "כן" },
  { page: 60, type: "word", tr: "שַאיְפוֹ", ar: "شايفه", he: "רואה אותו / אותה" },
  { page: 60, type: "word", tr: "תִסְלַמִי", ar: "تسلمي", he: "תודה / תבורכי (לאישה)" },
  { page: 60, type: "phrase", tr: "יַא רוּחִי", ar: "يا روحي", he: "נשמתי (פנייה בחיבה)" },
  { page: 60, type: "phrase", tr: "בְּ(אל)נַּגַ'אח וְ(אל)תַּוְפִיק", ar: "بالنجاح والتوفيق", he: "בהצלחה" },
  // vocabulary pp. 62–63
  { page: 62, type: "word", tr: "תַ", ar: "تَ", he: "עד ש... / כדי ש... (קיצור של חַתַּא)" },
  { page: 62, type: "word", tr: "מַפִיש", ar: "ما فيش", he: "אין", note: "גם: פִשּ, מַפִשּ, מַא פִי" },
  { page: 63, type: "word", tr: "מַדַאחֵ'ל", ar: "مداخل", he: "כניסות / פתחים", note: "יחיד: מַדְחַ'ל" },
  { page: 63, type: "word", tr: "פוֹתֵה", ar: "فوتة", he: "כניסה / פתח", note: "ר: פוֹתַאת" },
  { page: 63, type: "word", tr: "רַוְצַ'את", ar: "روضات", he: "גני ילדים", note: "יחיד: רַוְצַ'ה" },
  { page: 63, type: "word", tr: "שַאחְנַאת", ar: "شاحنات", he: "משאיות", note: "יחיד: שַאחְנֵה · גם: תְרַכַּאת" },
  { page: 63, type: "word", tr: "שֻוַכּ", ar: "شوك", he: "מזלגות", note: "יחיד: שוֹכֵּה" },
  { page: 63, type: "word", tr: "נְצַאץ", ar: "نصاص", he: "חצאים", note: "יחיד: נֻצּ" },
  { page: 63, type: "word", tr: "מַוְג'וּדִין", ar: "موجودين", he: "נמצאים", note: "נ׳: מַוְג'וּדֵה · נ׳ ר׳: מַוְג'וּדַאת" },
  { page: 63, type: "word", tr: "טַאלְעִין", ar: "طالعين", he: "עולים / יוצאים", note: "נ׳ ר׳: טַאלְעַאת" },
  { page: 63, type: "word", tr: "נַאזְלִין", ar: "نازلين", he: "יורדים", note: "נ׳ ר׳: נַאזְלַאת" },
];
(async () => {
  for (const c of CARDS) console.log(c.page, c.tr);
  if (!APPLY) return console.log(`${CARDS.length} — dry run`);
  const { data, error } = await sb.from("cards").insert(CARDS.map((c) => ({
    translit_nikud: c.tr, arabic_script: c.ar, hebrew_meaning: c.he, item_type: c.type,
    notes: [`ספר המדרשה עמ׳ ${c.page}`, c.note].filter(Boolean).join(" · "),
    lesson_id: L4, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "cards");
})();
