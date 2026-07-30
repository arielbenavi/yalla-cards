/**
 * Inserts מפגש 4 grammar paradigms and dialogue into the DB.
 * Paradigms: possessives (תבע), numbers (1-20), ordinals (1st-10th)
 * Dialogue: 5-line street encounter → also inserted as sentence cards
 * Run: npx tsx scripts/insert-meeting4-paradigms.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const MEETING = 4;
const LESSON_ID = "f92adfb7-cf83-4a08-910d-0f82fa7025da";

const paradigms = [
  {
    slug: "possessives",
    data: {
      description: "שייכות — צורת תָּבַע (תאע) + סיומת גוף (מפגש 4)",
      rows: [
        { person: "אנא (אני)",    ar: "تبعي",   translit: "תַבַּעִי" },
        { person: "אנת (אתה)",   ar: "تبعك",   translit: "תַבַּעַכּ" },
        { person: "אנתי (את)",   ar: "تبعك",   translit: "תַבַּעֵכּ" },
        { person: "הו (הוא)",    ar: "تبعه",   translit: "תַבַּעוֹ" },
        { person: "הי (היא)",    ar: "تبعها",  translit: "תַבַּעַה" },
        { person: "אחנא (אנחנו)", ar: "تبعنا", translit: "תַבַּעְנַא" },
        { person: "אנתו (אתם)",  ar: "تبعكم",  translit: "תַבַּעְכֹּם" },
        { person: "הם (הם)",     ar: "تبعهم",  translit: "תַבַּעְהֹם" },
      ],
      usage: "ה-X שלי = X + תבע + סיומת גוף. דוג': הבית שלי = אל-בֵּית תַּבַּעִי",
    },
  },
  {
    slug: "numbers",
    data: {
      description: "מספרים 1–20 — פלסטינית (מפגש 4)",
      note_gender: "1 ו-2 בלבד משתנים לפי מין. בפלסטינית 3-10 לא מחלקים לפי מין של השם העצם.",
      cardinal: {
        "1":  { m_ar: "واحد",     m_translit: "וַאחַד",       f_ar: "وحدة",       f_translit: "וַחְדֵה" },
        "2":  { m_ar: "تنين",     m_translit: "תְנֵין",       f_ar: "تنتين",      f_translit: "תִנְתֵין" },
        "3":  { ar: "تلاتة",      translit: "תַלַאתֵה",        short: "תַלַת" },
        "4":  { ar: "أربعة",      translit: "אַרְבַּעַה",       short: "אַרְבַּע" },
        "5":  { ar: "خمسة",       translit: "חַ'מְסֵה",         short: "חַ'מַס" },
        "6":  { ar: "ستة",        translit: "סִתֵּה",            short: "סִתּ" },
        "7":  { ar: "سبعة",       translit: "סַבְּעַה",          short: "סַבַּע" },
        "8":  { ar: "تمانية",     translit: "תַמַאנְיֵה",        short: "תַמַן" },
        "9":  { ar: "تسعة",       translit: "תִסְעַה",           short: "תִסַע" },
        "10": { ar: "عشرة",       translit: "עַשַרַה",           short: "עַשַר" },
        "11": { ar: "حداعش",      translit: "חְדַאעְשׁ" },
        "12": { ar: "طنعش",       translit: "טְנַאעְשׁ" },
        "13": { ar: "تلطعش",      translit: "תַלַטַּאעְשׁ" },
        "14": { ar: "اربعطعش",    translit: "אַרְבַּעְטַאעְשׁ" },
        "15": { ar: "خمسطعش",     translit: "חַ'מִסְטַאעְשׁ" },
        "16": { ar: "سطعش",       translit: "סִטַּאעְשׁ" },
        "17": { ar: "سبعطعش",     translit: "סַבַּעְטַאעְשׁ" },
        "18": { ar: "تمنطعش",     translit: "תַמַנְטַאעְשׁ" },
        "19": { ar: "تسعطعش",     translit: "תִסְעַטַאעְשׁ" },
        "20": { ar: "عشرين",      translit: "עִשְׁרִין" },
      },
    },
  },
  {
    slug: "ordinals",
    data: {
      description: "מספר סודר — ראשון עד עשירי, ז+נ (מפגש 4)",
      rows: [
        { he: "ראשון",  m_ar: "أول",    m_translit: "אַוַּל",      f_ar: "أولى",    f_translit: "אוּלַא" },
        { he: "שני",    m_ar: "تاني",   m_translit: "תַאנִי",      f_ar: "تانية",   f_translit: "תַאנְיֵה" },
        { he: "שלישי", m_ar: "تالت",   m_translit: "תַאלֵת",      f_ar: "تالتة",   f_translit: "תַאלְתֵה" },
        { he: "רביעי", m_ar: "رابع",   m_translit: "רַאבֵּע",     f_ar: "رابعة",   f_translit: "רַאבְּעַה" },
        { he: "חמישי", m_ar: "خامس",   m_translit: "חַ'אמֵס",     f_ar: "خامسة",   f_translit: "חַ'אמְסֵה" },
        { he: "שישי",  m_ar: "سادس",   m_translit: "סַאדֵס",      f_ar: "سادسة",   f_translit: "סַאדְסֵה" },
        { he: "שביעי", m_ar: "سابع",   m_translit: "סַאבֵּע",     f_ar: "سابعة",   f_translit: "סַאבְּעַה" },
        { he: "שמיני", m_ar: "تامن",   m_translit: "תַאמֵן",      f_ar: "تامنة",   f_translit: "תַאמְנֵה" },
        { he: "תשיעי", m_ar: "تاسع",   m_translit: "תַאסֵע",      f_ar: "تاسعة",   f_translit: "תַאסְעַה" },
        { he: "עשירי", m_ar: "عاشر",   m_translit: "עַאשֵׁר",     f_ar: "عاشرة",   f_translit: "עַאשְׁרַה" },
      ],
    },
  },
  {
    slug: "dialogue_street",
    data: {
      description: "דו-שיח: פגישה ברחוב — רועה ובאסם (מפגש 4)",
      context: "שני חברים נפגשים ברחוב",
      lines: [
        { speaker: "רועה",  he: "מרחבא! מה עשית? איך אתה?",            ar: "مرحبا! شو عملت؟ كيفك؟",           translit: "מַרְחַבַּא! שׁוּ עְמִלְת? כִּיפַכּ?" },
        { speaker: "באסם",  he: "מצוין! אלוהים ייתן לך בריאות. מה נשמע?", ar: "تمام! الله يعافيك. شو في ما في؟",  translit: "תַמַאם! אַללַּה יְעַאפִיכּ. שׁוּ פִי מַא פִי?" },
        { speaker: "רועה",  he: "יש לי מבחן מחר.",                      ar: "في عندي امتحان بكرا.",              translit: "פִי עִנְדִי אִמְתִחַאן בֻּכְּרַא." },
        { speaker: "באסם",  he: "אלוהים יצליח אותך יא רועה!",           ar: "الله يوفقك يا روعي!",              translit: "אַללַּה יְוַפְּקַכּ יַא רוֹעֵה!" },
        { speaker: "רועה",  he: "שישמור אותך (תודה).",                   ar: "يسلمك.",                           translit: "יְסַלְּמַכּ." },
      ],
    },
  },
];

// Dialogue lines also as sentence cards for flashcard review
type DialogueLine = { speaker: string; he: string; ar: string; translit: string };
const dialogueLines = (paradigms.find((p) => p.slug === "dialogue_street")?.data as unknown as { lines: DialogueLine[] })?.lines ?? [];
const dialogueCards = dialogueLines.map((line) => ({
    lesson_id: LESSON_ID,
    hebrew_meaning: line.he,
    translit_nikud: line.translit,
    arabic_script: line.ar,
    item_type: "sentence" as const,
    plural_form: null,
    chatifai_verified: true,
    notes: `דו-שיח מפגש 4 — ${line.speaker}`,
  }));

async function main() {
  // Insert paradigms
  console.log("⏳ Inserting paradigms...");
  for (const p of paradigms) {
    const { error } = await sb
      .from("paradigms")
      .upsert({ meeting: MEETING, slug: p.slug, data: p.data }, { onConflict: "meeting,slug" });
    if (error) console.error(`❌ paradigm ${p.slug}:`, error.message);
    else console.log(`✅ paradigm: ${p.slug}`);
  }

  // Insert dialogue as sentence cards (check dups first)
  console.log("\n⏳ Inserting dialogue sentence cards...");
  const { data: existing } = await sb
    .from("cards")
    .select("translit_nikud")
    .eq("lesson_id", LESSON_ID)
    .eq("item_type", "sentence");
  const existingTranslits = new Set((existing ?? []).map((c: { translit_nikud: string }) => c.translit_nikud));

  const toInsert = dialogueCards.filter((c) => !existingTranslits.has(c.translit_nikud));
  if (toInsert.length === 0) {
    console.log("✅ All sentence cards already exist");
    return;
  }

  const { data: inserted, error: cardErr } = await sb
    .from("cards")
    .insert(toInsert)
    .select("id, hebrew_meaning");
  if (cardErr) { console.error("❌ sentence cards:", cardErr.message); return; }

  console.log(`✅ Inserted ${inserted!.length} sentence cards`);
  inserted!.forEach((c: { id: string; hebrew_meaning: string }) =>
    console.log(`  • ${c.hebrew_meaning}`)
  );

  // card_srs for sentence cards
  const srsRows = inserted!.map((c: { id: string }) => ({ card_id: c.id, direction: "he_to_ar" }));
  const { error: srsErr } = await sb.from("card_srs").insert(srsRows);
  if (srsErr) console.warn("⚠  card_srs:", srsErr.message);
  else console.log(`✅ ${srsRows.length} card_srs rows for sentences`);
}

main().catch((e) => { console.error(e); process.exit(1); });
