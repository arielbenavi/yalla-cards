// Preply lesson 1 with Leyla (2026-10-24): the sentences she wrote in Arabic script
// during class, and the new words in them. Pointing by chatifai (chat
// 6ada9c7bcab92323ed0bd261) — nikud only; the meanings are the lesson's. Where she
// wrote a literary form (أيضا, الآن, نحن…), the card keeps what she wrote and
// chatifai's spoken form is in the notes.
//
// Anything whose letters already match a card is skipped (printed).
//
//   npx tsx scripts/insert-preply-leyla-1.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

type C = { tr: string; ar: string; he: string; note?: string };

const SENTENCES: C[] = [
  { tr: "אִלְיוֹם צְחִית מִנִ (אל)נּוֹם", ar: "اليوم صحيت من النوم", he: "היום התעוררתי מהשינה" },
  { tr: "אַפְטַרְת וְעִמִלְת פְטוּר לַלְעֵילֵה", ar: "أفطرت وعملت فطور للعيلة", he: "אכלתי ארוחת בוקר והכנתי ארוחת בוקר למשפחה" },
  { tr: "וּבַּעְדְהַא חַצַּ'רְת לַדְרוּסִי", ar: "وبعدها حضرت لدروسي", he: "ואחר כך הגעתי לשיעורים שלי" },
  { tr: "אַיְצַ'ן טַבַּחְ'תִ (א)לְעַ'דַאא", ar: "أيضا طبخت الغداء", he: "גם בישלתי את ארוחת הצהריים", note: "במדוברת: כַּמַאן טַבַּחְ'תִ (א)לְעַ'דַא" },
  { tr: "וְאַנַא (א)לְאַאן פִי דַרְסְנַא", ar: "وأنا الآن في درسنا", he: "ואני עכשיו בשיעור שלנו", note: "במדוברת: וְאַנַא הַלְקֵית פִי דַרְסְנַא" },
  { tr: "צַבַּאחִ (א)לְחֵ'יר", ar: "صباح الخير", he: "בוקר טוב" },
  { tr: "מַסַאאִ (א)לְחֵ'יר", ar: "مساء الخير", he: "ערב טוב" },
  { tr: "אַפַרְשִי אַסְנַאנִי", ar: "أفرشي أسناني", he: "אני מצחצח שיניים", note: "במדוברת: בַּפַרְשִי סְנַאנִי" },
  { tr: "מוֹז וּבּוּדִינְעִ' (אל)שִּׁיַא", ar: "موز و بودينغ الشيا", he: "בננה ופודינג צ'יה" },
  { tr: "בַּעְדִ (א)לְאִגְ'תִמַאע עִמִלְת לַנַפְסִי חֻ'בְּז מְחַמַּץ וּבֵּיצ' וּאַפוֹכַּאדוֹ וּאֻמִּי נַאדַתְנִי (א)לְאַאן", ar: "بعد الاجتماع عملت لنفسي خبز محمص وبيض و أفوكادو وأمي نادتني الآن", he: "אחרי הפגישה הכנתי לעצמי טוסט וביצים ואבוקדו, ואמא שלי קראה לי עכשיו", note: "במדוברת: …נַאדַתְנִי הַלְקֵית" },
  { tr: "שוּ בְּתִחִבּ תִעְמַל פִי וַקְת פַרַאעַ'כּ?", ar: "شو بتحب تعمل في وقت فراغك؟", he: "מה אתה אוהב לעשות בזמן הפנוי שלך?" },
  { tr: "אַלְעַבּ שַטַרַנְג'", ar: "ألعب شطرنج", he: "אני משחק שחמט", note: "במדוברת: בַּלְעַבּ שַטַרַנְג'" },
  { tr: "אֻחִבִּּ (אל)סִּבַּאחַה", ar: "أحب السباحة", he: "אני אוהב שחייה", note: "במדוברת: בַּחִבִּּ (אל)סִּבַּאחַה" },
  { tr: "מֻשַאְהַדַתִ (אל)תִּלְפִזְיוֹן", ar: "مشاهدة التلفزيون", he: "צפייה בטלוויזיה" },
  { tr: "אַנַא זֻרְת חֵיפַא וִ(א)לְקֻדְס קַבֵּל חַ'מְס סַנַוַאת פִי פַצְלִ (אל)צֵּיף", ar: "أنا زرت حيفا والقدس قبل خمس سنوات في فصل الصيف", he: "ביקרתי בחיפה ובירושלים לפני 5 שנים, בקיץ" },
  { tr: "פַלַסְטִין גַ'מִילֵה", ar: "فلسطين جميلة", he: "פלסטין יפה" },
  { tr: "נַחְנֻ (א)לְאַאן פִי פַצְלִ (אל)שִּתַאא וְהֻוֵּ בַּארֵד", ar: "نحن الآن في فصل الشتاء وهو بارد", he: "אנחנו עכשיו בחורף, והוא קר", note: "במדוברת: אִחְנַא הַלְקֵית פִי פַצְלִ (אל)שִּתַא" },
  { tr: "אַנַא אֻפַצִּ'ל פַצְלִ (אל)צֵּיף", ar: "أنا أفضل فصل الصيف", he: "אני מעדיף את הקיץ", note: "במדוברת: אַנַא בַּפַצִּ'ל" },
  { tr: "כִּיפִ (אל)גַּ'וּ פִי תֻרְכִּיַא?", ar: "كيف الجو في تركيا؟", he: "איך מזג האוויר בטורקיה?" },
  { tr: "אַיְצַ'ן בַּארֵד", ar: "أيضا بارد", he: "גם קר", note: "במדוברת: כַּמַאן בַּארֵד" },
  { tr: "כַּם עֻמְרַכּ?", ar: "كم عمرك؟", he: "בן כמה אתה?", note: "גם: קַדֵּיש עֻמְרַכּ?" },
  { tr: "עֻמְרִי סִתֵּה וְעִשְרִין", ar: "عمري ستة وعشرين", he: "אני בן 26" },
  { tr: "אִלְעֻמֹר כֻּלּוֹ", ar: "العمر كله", he: "שתחיה עד 120 (ברכה כשמישהו אומר את גילו)" },
  { tr: "מִנְ וֵין אִנְתֵ?", ar: "من وين انت؟", he: "מאיפה אתה?" },
  { tr: "אַנַא אַמְרִיכִּי וּפַלַסְטִינִי", ar: "انا أمريكي وفلسطيني", he: "אני אמריקאי ופלסטיני" },
  { tr: "שוּ דַרַסְת?", ar: "شو درست؟", he: "מה למדת?" },
  { tr: "אַנַא טַאלֵבּ מַאגִ'סְתֵיר פִי גַ'אמְעַת כּוֹלוֹמְבִּיַא פִי נְיוּ יוֹרְכּ", ar: "أنا طالب ماجستير في جامعة كولومبيا في نيويورك", he: "אני סטודנט לתואר שני באוניברסיטת קולומביה בניו יורק" },
  { tr: "וְאַנַא מֻבַּרְמִג'", ar: "وأنا مبرمج", he: "ואני מתכנת" },
];

const WORDS: C[] = [
  { tr: "אַפְטַרְת", ar: "أفطرت", he: "אכלתי ארוחת בוקר" },
  { tr: "פְטוּר", ar: "فطور", he: "ארוחת בוקר" },
  { tr: "בַּעְדְהַא", ar: "بعدها", he: "אחר כך / אחרי זה" },
  { tr: "חַצַּ'רְת", ar: "حضرت", he: "נכחתי / הגעתי" },
  { tr: "דֻרוּס", ar: "دروس", he: "שיעורים", note: "דֻרוּסִי = השיעורים שלי · יחיד: דַרְס" },
  { tr: "אַיְצַ'ן", ar: "أيضا", he: "גם", note: "ספרותי; במדוברת: כַּמַאן" },
  { tr: "טַבַּחְ'ת", ar: "طبخت", he: "בישלתי" },
  { tr: "אִלְאַאן", ar: "الآن", he: "עכשיו", note: "ספרותי; במדוברת: הַלְקֵית (עירוני) / הַלְקִיאֵת (כפרי)" },
  { tr: "סִנּ", ar: "سن", he: "שן", note: "ר: אַסְנַאן (במדוברת סְנַאן)" },
  { tr: "אַסְנַאן", ar: "أسنان", he: "שיניים", note: "במדוברת: סְנַאן · אַפַרְשִי אַסְנַאנִי = אני מצחצח שיניים" },
  { tr: "מוֹז", ar: "موز", he: "בננות" },
  { tr: "אִגְ'תִמַאע", ar: "اجتماع", he: "פגישה / ישיבה" },
  { tr: "לַנַפְסִי", ar: "لنفسي", he: "לעצמי", note: "במדוברת גם: לַחַאלִי" },
  { tr: "חֻ'בְּז מְחַמַּץ", ar: "خبز محمص", he: "טוסט / לחם קלוי" },
  { tr: "בֵּיצ'", ar: "بيض", he: "ביצים" },
  { tr: "אַפוֹכַּאדוֹ", ar: "أفوكادو", he: "אבוקדו" },
  { tr: "נַאדַתְנִי", ar: "نادتني", he: "(היא) קראה לי" },
  { tr: "וַקְת פַרַאע'", ar: "وقت فراغ", he: "זמן פנוי" },
  { tr: "סִבַּאחַה", ar: "سباحة", he: "שחייה" },
  { tr: "מֻשַאְהַדַה", ar: "مشاهدة", he: "צפייה" },
  { tr: "תִלְפִזְיוֹן", ar: "تلفزيون", he: "טלוויזיה" },
  { tr: "זֻרְת", ar: "زرت", he: "ביקרתי" },
  { tr: "סַנַוַאת", ar: "سنوات", he: "שנים", note: "יחיד: סַנַה" },
  { tr: "פַצְל", ar: "فصل", he: "עונה (בשנה)" },
  { tr: "אִ(ל)צֵּיף", ar: "الصيف", he: "הקיץ" },
  { tr: "אִ(ל)שִּתַאא", ar: "الشتاء", he: "החורף", note: "במדוברת: אִ(ל)שִּתַא" },
  { tr: "פַלַסְטִין", ar: "فلسطين", he: "פלסטין" },
  { tr: "גַ'מִילֵה", ar: "جميلة", he: "יפה (נ)", note: "ז: גַ'מִיל" },
  { tr: "אֻפַצִּ'ל", ar: "أفضل", he: "אני מעדיף", note: "במדוברת: בַּפַצִּ'ל" },
  { tr: "אִלְגַּ'וּ", ar: "الجو", he: "מזג האוויר" },
  { tr: "תֻרְכִּיַא", ar: "تركيا", he: "טורקיה" },
  { tr: "מֻסְתַשְפַא", ar: "مستشفى", he: "בית חולים" },
  { tr: "מֻוַאצַלַאת", ar: "مواصلات", he: "תחבורה (ציבורית)" },
  { tr: "מֻסְתַקְבַּל", ar: "مستقبل", he: "עתיד", note: "בעירונית: מֻסְתַאְבַּל" },
  { tr: "מַאגִ'סְתֵיר", ar: "ماجستير", he: "תואר שני" },
  { tr: "אַמְרִיכִּי", ar: "أمريكي", he: "אמריקאי" },
  { tr: "פַלַסְטִינִי", ar: "فلسطيني", he: "פלסטיני" },
  { tr: "דַרַסְת", ar: "درست", he: "למדתי" },
  { tr: "אִלְקֻדְס", ar: "القدس", he: "ירושלים", note: "בעירונית: אִלְאֻדְס" },
];

const sk = (s: string) =>
  s.replace(/[֑-ׇ'׳()?؟.,!]/g, "").replace(/[ךםןףץ]/g, (c) => ({ ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" } as Record<string, string>)[c]).replace(/\s+/g, " ").trim();
// Same thing spelled a little differently from the card that has it
const ALSO_HAVE = new Set(["מַסַאאִ (א)לְחֵ'יר", "אִ(ל)שִּתַאא"]);

async function main() {
  const all: { translit_nikud: string; hebrew_meaning: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("cards").select("translit_nikud, hebrew_meaning").range(f, f + 999);
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const have = new Map(all.map((c) => [sk(c.translit_nikud), c]));
  const keep: (C & { type: string })[] = [];
  for (const [list, type] of [[SENTENCES, "sentence"], [WORDS, "word"]] as const) {
    for (const c of list) {
      // בֵּיצ' (eggs) only shares its letters with בִּיצ' (white, plural)
      const hit = (c.tr === "בֵּיצ'" ? undefined : have.get(sk(c.tr))) ?? (ALSO_HAVE.has(c.tr) ? { translit_nikud: "(near-identical card)", hebrew_meaning: "" } : undefined);
      if (hit) console.log("skip (exists):", c.tr, "≈", hit.translit_nikud, "=", hit.hebrew_meaning);
      else keep.push({ ...c, type: type === "word" && c.tr.includes(" ") ? "phrase" : type });
    }
  }
  console.log(`\n${keep.length} new cards`);
  if (!APPLY) return console.log("dry run — add --apply");

  const { data: lesson, error: le } = await sb
    .from("lessons")
    .insert({ title: "Preply Leyla 1", date: "2026-10-24", source: "preply", teacher: "Leyla", meeting: 1 })
    .select("id")
    .single();
  if (le) throw le;
  const rows = keep.map((c) => ({
    translit_nikud: normalizeMarks(c.tr),
    arabic_script: c.ar,
    hebrew_meaning: c.he,
    notes: ["Preply · Leyla", c.note].filter(Boolean).join(" · "),
    item_type: c.type,
    lesson_id: lesson.id,
    chatifai_verified: true,
  }));
  const { data, error } = await sb.from("cards").insert(rows).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅ lesson", lesson.id, "·", data!.length, "cards");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
