/**
 * Inserts מפגש 4 vocabulary cards into the DB.
 * Data sourced from chatifai validation (batches 1-3, w001-w078).
 * w077 skipped — duplicate of w023 (same word: מדח׳ל).
 * Run: npx tsx scripts/insert-meeting4-vocab.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const LESSON_ID = "f92adfb7-cf83-4a08-910d-0f82fa7025da";

type Card = {
  lesson_id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string;
  item_type: "word" | "phrase";
  plural_form: string | null;
  chatifai_verified: boolean;
  notes: string | null;
};

const cards: Omit<Card, "lesson_id">[] = [
  // ─── מיקום (position words) ───
  { hebrew_meaning: "אחרי / מאחרי", translit_nikud: "וַרַא", arabic_script: "وراء", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "מול / לפנים", translit_nikud: "קֻדַּאם", arabic_script: "قدام", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "לפני / מול", translit_nikud: "קְבַּאל", arabic_script: "قبال", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "ליד / לצד", translit_nikud: "גַ'מְבּ", arabic_script: "جنب", item_type: "word", plural_form: null, chatifai_verified: true, notes: "גם: ג׳נב" },
  { hebrew_meaning: "מתחת / תחת / למטה", translit_nikud: "תַחְת", arabic_script: "تحت", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "מעל / על / למעלה", translit_nikud: "פוֹק", arabic_script: "فوق", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "בערך / סביב", translit_nikud: "חַוַאלִי", arabic_script: "حوالي", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "כאן", translit_nikud: "הוֹן", arabic_script: "هون", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "שם", translit_nikud: "הֻנַאכּ", arabic_script: "هناك", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "חוץ / בחוץ / החוצה", translit_nikud: "בַּרַּא", arabic_script: "برا", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "פנימה / בפנים", translit_nikud: "גֻ'וַּא", arabic_script: "جوا", item_type: "word", plural_form: null, chatifai_verified: true, notes: "גם: ג׳ועה (בתוך)" },
  { hebrew_meaning: "ישר / מיד", translit_nikud: "דֻעְ'רִי", arabic_script: "دغري", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "עד", translit_nikud: "לַחַדּ", arabic_script: "لحد", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  // ─── חיבורים / מילות שימוש ───
  { hebrew_meaning: "כמו", translit_nikud: "זַיּ / מִתֵל", arabic_script: "زي / مثل", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "זהו / מספיק / אבל", translit_nikud: "בַּס", arabic_script: "بس", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "אחרי", translit_nikud: "בַּעַד", arabic_script: "بعد", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "לפני", translit_nikud: "קַבֵּל", arabic_script: "قبل", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "עד ש / כדי / אפילו", translit_nikud: "חַתַּא", arabic_script: "حتى", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "אשר / ש...", translit_nikud: "אִלִּי", arabic_script: "اللي", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "אין", translit_nikud: "פִישׁ / מַא פִישׁ / מַא פִי", arabic_script: "فيش / ما فيش / ما في", item_type: "word", plural_form: null, chatifai_verified: true, notes: "3 צורות שלילה" },
  { hebrew_meaning: "אבל", translit_nikud: "אַמַּא", arabic_script: "أما", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  // ─── שמות עצם — מספרים וכניסה ───
  { hebrew_meaning: "מספר / מניין פריטים", translit_nikud: "עַדַד", arabic_script: "عدد", item_type: "word", plural_form: "אַעְדַאד", chatifai_verified: true, notes: null },
  { hebrew_meaning: "כניסה / פתח", translit_nikud: "מַדְחַ'ל", arabic_script: "مدخل", item_type: "word", plural_form: "מַדַאחֵ'ל", chatifai_verified: true, notes: null },
  { hebrew_meaning: "גן ילדים", translit_nikud: "רַוְצַ'ת אַטְפַאל", arabic_script: "روضة أطفال", item_type: "word", plural_form: "רַוְצַ'את אַטְפַאל", chatifai_verified: true, notes: "סמיכות" },
  { hebrew_meaning: "תינוק / פעוט", translit_nikud: "טִפֵל", arabic_script: "طفل", item_type: "word", plural_form: "אַטְפַאל", chatifai_verified: true, notes: null },
  // ─── תחבורה ───
  { hebrew_meaning: "משאית", translit_nikud: "שַׁאחְנֵה / תְרַכּ", arabic_script: "شاحنة / ترك", item_type: "word", plural_form: "שַׁאחְנַאת / תְרַכַּאת", chatifai_verified: true, notes: null },
  { hebrew_meaning: "הובלה", translit_nikud: "נַקְלֵה", arabic_script: "نقلة", item_type: "word", plural_form: "נַקְלַאת", chatifai_verified: true, notes: null },
  { hebrew_meaning: "חנייה", translit_nikud: "מַוְקֵף", arabic_script: "موقف", item_type: "word", plural_form: "מַוַאקֵף", chatifai_verified: true, notes: null },
  { hebrew_meaning: "מזלג / פיצול דרכים", translit_nikud: "שׁוֹכֵּה", arabic_script: "شوكة", item_type: "word", plural_form: "שֻׁוַכּ", chatifai_verified: true, notes: "גם: כלי אוכל — מזלג" },
  { hebrew_meaning: "כביש / דרך", translit_nikud: "טַרִיק", arabic_script: "طريق", item_type: "word", plural_form: "טֻרֻק", chatifai_verified: true, notes: null },
  // ─── מספרים / כמות ───
  { hebrew_meaning: "חצי", translit_nikud: "נֻצּ", arabic_script: "نص", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  // ─── תואר ───
  { hebrew_meaning: "נמצא (ז)", translit_nikud: "מַוְג'וּד", arabic_script: "موجود", item_type: "word", plural_form: "מַוְג'וּדִין", chatifai_verified: true, notes: null },
  // ─── זמן ───
  { hebrew_meaning: "שחר / עלות השחר", translit_nikud: "פַגֵ'ר", arabic_script: "فجر", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "בוקר", translit_nikud: "צֻבֵּח", arabic_script: "صبح", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "צהריים", translit_nikud: "צֻ'הֻר", arabic_script: "ظهر", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "אחר הצהריים / תקופה", translit_nikud: "עַצֵר", arabic_script: "عصر", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "בין ערביים", translit_nikud: "מַעְ'רֵבּ", arabic_script: "مغرب", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "ערב", translit_nikud: "מַסַא", arabic_script: "مسا", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "לילה", translit_nikud: "לֵיל", arabic_script: "ليل", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "תפילה", translit_nikud: "צַלַאה", arabic_script: "صلاة", item_type: "word", plural_form: "צַלַוַאת", chatifai_verified: true, notes: null },
  { hebrew_meaning: "אור", translit_nikud: "צַ'וְ", arabic_script: "ضو", item_type: "word", plural_form: "אַצְ'וַאא", chatifai_verified: true, notes: null },
  { hebrew_meaning: "חושך / אפילה", translit_nikud: "עַתְמֵה", arabic_script: "عتمة", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "מלא (ז)", translit_nikud: "מַלַאן", arabic_script: "ملان", item_type: "word", plural_form: "מַלַאנִין", chatifai_verified: true, notes: null },
  { hebrew_meaning: "ריק / פנוי (ז)", translit_nikud: "פַאצִ'י", arabic_script: "فاضي", item_type: "word", plural_form: "פַאצִ'יִין", chatifai_verified: true, notes: null },
  { hebrew_meaning: "לגמרי / בכלל", translit_nikud: "בִּ(א)לְמַרַּה", arabic_script: "بالمرة", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "מקור / מקורי", translit_nikud: "אַצֵל", arabic_script: "أصل", item_type: "word", plural_form: "אֻצוּל", chatifai_verified: true, notes: null },
  { hebrew_meaning: "תמיד", translit_nikud: "דַאיְמַן", arabic_script: "دايما", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "עמוד", translit_nikud: "עַאמוּד", arabic_script: "عامود", item_type: "word", plural_form: "עֻמְדַאן", chatifai_verified: true, notes: null },
  // ─── אוכל ───
  { hebrew_meaning: "בשר", translit_nikud: "לַחֵם", arabic_script: "لحم", item_type: "word", plural_form: "לֻחוּם", chatifai_verified: true, notes: null },
  { hebrew_meaning: "קצבייה / אטליז", translit_nikud: "מַלְחַמֵה", arabic_script: "ملحمة", item_type: "word", plural_form: "מַלַאחֵם", chatifai_verified: true, notes: "לא כמו מלחמה=war! שורש ל.ח.מ = לחם" },
  { hebrew_meaning: "לחם", translit_nikud: "חֻ'בֵּז", arabic_script: "خبز", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  // ─── מקומות ───
  { hebrew_meaning: "מאפייה", translit_nikud: "מַחְ'בַּזֵה", arabic_script: "مخبزة", item_type: "word", plural_form: "מַחַ'אבֵּז", chatifai_verified: true, notes: null },
  { hebrew_meaning: "מסעדה", translit_nikud: "מַטְעַם", arabic_script: "مطعم", item_type: "word", plural_form: "מַטַאעֵם", chatifai_verified: true, notes: null },
  { hebrew_meaning: "שכונה", translit_nikud: "חַיּ / חַארה", arabic_script: "حي / حارة", item_type: "word", plural_form: "אַחְיַאא / חַאראת", chatifai_verified: true, notes: "חי (ז) / חארה (נ)" },
  // ─── כללי ───
  { hebrew_meaning: "חשמל", translit_nikud: "כַּהְרַבַּא", arabic_script: "كهرباء", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "פלאפון / סלולרי", translit_nikud: "גַ'וַּאל", arabic_script: "جوال", item_type: "word", plural_form: "גַ'וַּאלַאת", chatifai_verified: true, notes: null },
  // ─── ביטויים (phrases) ───
  { hebrew_meaning: "סליחה / ברשותך", translit_nikud: "מִן פַצְ'לַכּ / לַוְ סַמַחְת", arabic_script: "من فضلك / لو سمحت", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "אפשר / בסדר / תשומת לב", translit_nikud: "מַעְלֵישׁ", arabic_script: "معليش", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "סליחה (בקשת סליחה)", translit_nikud: "אָאסֵף / סוֹרִי", arabic_script: "آسف / سوري", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: null },
  // ─── לימודים ───
  { hebrew_meaning: "מבחן / בחינה", translit_nikud: "אִמְתִחַאן", arabic_script: "امتحان", item_type: "word", plural_form: "אִמְתִחַאנַאת", chatifai_verified: true, notes: null },
  { hebrew_meaning: "קו (אוטובוס)", translit_nikud: "חַ'טּ", arabic_script: "خط", item_type: "word", plural_form: "חֻ'טוּט", chatifai_verified: true, notes: null },
  { hebrew_meaning: "מספר (מידה/חשבון)", translit_nikud: "נֻמְרַה", arabic_script: "نمرة", item_type: "word", plural_form: "נֻמַר", chatifai_verified: true, notes: null },
  { hebrew_meaning: "מזגן", translit_nikud: "מֻכַּיֵּף", arabic_script: "مكيف", item_type: "word", plural_form: "מֻכַּיִּפַאת", chatifai_verified: true, notes: null },
  { hebrew_meaning: "הצלחה", translit_nikud: "נַגַ'אח", arabic_script: "نجاح", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "הצלחה / תופיק", translit_nikud: "תַוְפִיק", arabic_script: "توفيق", item_type: "word", plural_form: null, chatifai_verified: true, notes: "גם שם פרטי" },
  { hebrew_meaning: "שותף (עסקי)", translit_nikud: "שַׁרִיכּ", arabic_script: "شريك", item_type: "word", plural_form: "שֻׁרַכַּאא", chatifai_verified: true, notes: null },
  { hebrew_meaning: "קצבייה (מקום מכירת בשר)", translit_nikud: "מַלְחַמֵה", arabic_script: "ملحمة", item_type: "word", plural_form: "מַלַאחֵם", chatifai_verified: true, notes: "chatifai: זהה ל-ملحمة. ייתכן גם: مرحمة" },
  { hebrew_meaning: "צומת", translit_nikud: "מַפְרַק", arabic_script: "مفرق", item_type: "word", plural_form: "מַפַארֵק", chatifai_verified: true, notes: null },
  { hebrew_meaning: "גברתי (פנייה לאשה מבוגרת)", translit_nikud: "חַגֵ'ה", arabic_script: "حجة", item_type: "phrase", plural_form: "חַגַ'את", chatifai_verified: true, notes: null },
  { hebrew_meaning: "הולך / זורם / סבבה", translit_nikud: "מַאשִׁי", arabic_script: "ماشي", item_type: "word", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "הסוגייה / הנושא", translit_nikud: "קַצִ'יֵּה", arabic_script: "قضية", item_type: "word", plural_form: "קַצַ'איַא", chatifai_verified: true, notes: null },
  { hebrew_meaning: "הסכסוך", translit_nikud: "סִירַה", arabic_script: "سيرة", item_type: "word", plural_form: "סִיַר", chatifai_verified: true, notes: null },
  { hebrew_meaning: "מיד לאחר / ישר", translit_nikud: "עַלַא טוּל", arabic_script: "على طول", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "יש לי", translit_nikud: "פִי עַלַיּ", arabic_script: "في علي", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: null },
  { hebrew_meaning: "בוא תגיד / אמרי לי (לאישה)", translit_nikud: "אִחְכִּי", arabic_script: "احكي", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: "פנייה לאישה" },
  { hebrew_meaning: "אלוהים יברך (ברכה מוסלמית)", translit_nikud: "בַּארַכּ אַללַּה פִיכּ", arabic_script: "بارك الله فيك", item_type: "phrase", plural_form: null, chatifai_verified: true, notes: "בין מוסלמים" },
];

async function main() {
  // Verify lesson exists
  const { data: lesson } = await sb.from("lessons").select("id, title").eq("id", LESSON_ID).single();
  if (!lesson) { console.error("❌ lesson not found:", LESSON_ID); process.exit(1); }
  console.log(`✅ lesson: ${lesson.title}`);

  // Check for existing cards in this lesson to avoid duplicates
  const { data: existing } = await sb
    .from("cards")
    .select("translit_nikud")
    .eq("lesson_id", LESSON_ID);
  const existingTranslits = new Set((existing ?? []).map((c: { translit_nikud: string }) => c.translit_nikud));
  console.log(`ℹ  ${existingTranslits.size} cards already in lesson`);

  const toInsert = cards
    .filter((c) => !existingTranslits.has(c.translit_nikud))
    .map((c) => ({ ...c, lesson_id: LESSON_ID }));

  if (toInsert.length === 0) {
    console.log("✅ All cards already exist — nothing to insert");
    return;
  }

  console.log(`⏳ Inserting ${toInsert.length} cards...`);
  const { data: inserted, error } = await sb
    .from("cards")
    .insert(toInsert)
    .select("id, hebrew_meaning");

  if (error) { console.error("❌ insert error:", error.message); process.exit(1); }

  console.log(`✅ Inserted ${inserted!.length} cards`);
  inserted!.forEach((c: { id: string; hebrew_meaning: string }) =>
    console.log(`  • ${c.hebrew_meaning}`)
  );

  // Create card_srs rows
  const srsRows = inserted!.map((c: { id: string }) => ({ card_id: c.id, direction: "he_to_ar" }));
  const { error: srsErr } = await sb.from("card_srs").insert(srsRows);
  if (srsErr) console.warn("⚠  card_srs:", srsErr.message);
  else console.log(`✅ ${srsRows.length} card_srs rows created`);
}

main().catch((e) => { console.error(e); process.exit(1); });
