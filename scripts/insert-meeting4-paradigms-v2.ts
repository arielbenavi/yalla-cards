// The מפגש 4 grammar the vocabulary list does not cover (task #2): the تبع
// possessive and the number rules. All confirmed by chatifai on 2026-07-31.
//
// Where chatifai contradicted the teacher's note or the printed book, BOTH are
// recorded. The teacher is the authority in class; chatifai is the authority on
// the language; the learner should see the disagreement rather than a silently
// picked winner.
//
//   npx tsx scripts/insert-meeting4-paradigms-v2.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const POSSESSIVE = {
  description: "שייכות עם תַבַּע — נטייה מלאה לשם עצם זכר ולשם עצם נקבה (מפגש 4)",
  chatifai_verified: true,
  verified_at: "2026-07-31",
  masculine: {
    example: "אִלְכִּתַאבּ תַבַּעִי",
    rows: [
      { person: "אנא", form: "תַבַּעִי" },
      { person: "אנת", form: "תַבַּעַכּ" },
      { person: "אנתי", form: "תַבַּעֵכּ" },
      { person: "הו", form: "תַבַּעוֹ" },
      { person: "הי", form: "תַבַּעַהַא", variant: "תַבַּעַא" },
      { person: "אחנא", form: "תַבַּעְנַא" },
      { person: "אנתו", form: "תַבַּעְכֹּם" },
      { person: "הם", form: "תַבַּעְהֹם" },
    ],
  },
  feminine: {
    example: "אִלְסַיַּארַה תַבַּעְתִי",
    note: "שים לב לשינוי הגזע: גוף ראשון ושני יחיד — תַבַּעְתְ־ בשווא; גוף שלישי והרבים — תַבַּעִתְ־ בחיריק. הקיצור 'כמו תַבַּעַת' שבהערות השיעור מסתיר את ההבדל הזה.",
    rows: [
      { person: "אנא", form: "תַבַּעְתִי" },
      { person: "אנת", form: "תַבַּעְתַכּ" },
      { person: "אנתי", form: "תַבַּעְתֵכּ" },
      { person: "הו", form: "תַבַּעְתוֹ" },
      { person: "הי", form: "תַבַּעִתְהַא" },
      { person: "אחנא", form: "תַבַּעִתְנַא" },
      { person: "אנתו", form: "תַבַּעִתְכֹּם" },
      { person: "הם", form: "תַבַּעִתְהֹם" },
    ],
  },
  when_to_use_tabaa: [
    "לא בבני אדם — לא אומרים אִלְאַבּ תַבַּעִי אלא אַבּוּי. שייכות ישירה שמורה למשפחה ולחברים קרובים.",
    "כששם העצם נגמר ב-א, ו או י — קשה להטות אותו ישירות, אז אִלְכֻּרְסִי תַבַּעַכּ.",
    "במילים לועזיות — תַלְפַזְיוֹן, כַּמְבְּיוּתֵר, גַ'וַּאל כמעט תמיד עם תַבַּע.",
  ],
  disagreement: {
    topic: "תַבַּע מול תַע",
    teacher: "המורה אמר שתַע פחות נפוץ.",
    chatifai:
      "chatifai חולק: בלהג הירושלמי והעירוני תַע נפוץ מאוד דווקא, כי הוא קצר ומהיר. תַבַּע נשמע מלא יותר, לעיתים כפרי או צפוני. שניהם נכונים — זה פילוג אזורי ולא דירוג שכיחות.",
  },
  rasmba:
    "לריבוי שאינו בני אדם: תַבַּעְתְנַא קיים ותקין, ותַבַּעִיתְנַא נפוץ מאוד ונשמע מקומי יותר. ברחוב רבים פשוט אומרים תַבַּעְנַא גם על חפצים ברבים.",
};

const NUMBERS = {
  description: "כללי שם המספר (מפגש 4) — מאומת chatifai",
  chatifai_verified: true,
  verified_at: "2026-07-31",
  gender: {
    rule: "רק ב-1 וב-2 יש הבחנת מין. מ-3 עד 10 אין הבדל בלהג הפלסטיני, בניגוד לספרותית.",
    forms: [
      { n: 1, m: "וַאחַד", f: "וַחְדֵה" },
      { n: 2, m: "תְנֵין", f: "תִנְתֵין" },
    ],
    example: "חַ'מְסֵה וְלַאד = חַ'מְסֵה בַּנַאת — אותה צורה לשני המינים",
    note: "הערות השיעור נתנו רק וַאחַד/וַחְדֵה; גם ל-2 יש הבחנה — תְנֵין/תִנְתֵין.",
  },
  counted_noun: {
    rule: "מ-11 ומעלה שם העצם שאחרי המספר בא ביחיד. chatifai: כלל ברזל בלהג.",
    examples: ["חַ'מִסְטַעְשַר וַלַד = 15 ילדים", "עִשְרִין סַיַּארַה = 20 מכוניות"],
    note: "chatifai מנקד חַ'מִסְטַעְשַר בחיריק ב-מ׳; הספר מדפיס חַ'מְסְטַעְשַר.",
  },
  teens_suffix: {
    rule: "ב-11–19 מוסיפים -ר כשבא אחריהם שם עצם, לא כשרק סופרים.",
    counting: "חְדַעְש, טְנַעְש, תַלַטַּעְש",
    with_noun: "חְדַעְשַר קַלַם (11 עטים), טְנַעְשַר בִּנְת (12 בנות)",
    disagreement:
      "הערות השיעור מנוסחות כאילו ה-ר נוסף דווקא כשמונים. chatifai אומר את ההפך: ה-ר נוסף לפני שם עצם. שווה לבדוק את ניסוח ההערה מול המורה.",
  },
  alef_to_ta: {
    rule: "במילים שמתחילות ב-א, אחרי המספרים 3–10 ה-א מתחלפת ב-ת.",
    forms: [
      { base: "אַיַּאם", combined: "חַ'מְסְ-תִיַּאם", arabic: "خمس تيام", he: "5 ימים",
        book_form: "חַ'מֵס תְחַאם", note: "צורת הספר כנראה שגיאת קריאה מהצילום — אין ח׳ בצורה בכלל" },
      { base: "אַשְהוּר", combined: "אַרְבַּע-תֻשְהֹר", arabic: "أربع تشهر", he: "4 חודשים" },
      { base: "אַרְבַּאע", combined: "תַלַת-תִרְבַּאע", arabic: "تلت ترباع", he: "3/4" },
      { base: "אַלַאף", combined: "תִסַע-תַלַאף", arabic: "تسع تلاف", he: "9000" },
    ],
    note: "ث נהגית בפלסטינית לרוב כ-ת רגילה או ס; בתַלַאתֵה ובתַלַאף שומעים ת פשוטה.",
  },
};

async function main() {
  // Typed as unknown-shaped jsonb: the two paradigms have different shapes, and
  // without this TS infers the array element type from the first one.
  const rows: { meeting: number; slug: string; data: Record<string, unknown> }[] = [
    { meeting: 4, slug: "possessive_tabaa", data: POSSESSIVE as unknown as Record<string, unknown> },
    { meeting: 4, slug: "numbers_rules", data: NUMBERS as unknown as Record<string, unknown> },
  ];

  for (const r of rows) {
    console.log(`■ meeting ${r.meeting} / ${r.slug} — ${JSON.stringify(r.data).length} bytes`);
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  for (const r of rows) {
    const { error } = await sb.from("paradigms").upsert(r, { onConflict: "meeting,slug" });
    if (error) throw error;
    console.log(`✅ ${r.slug}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
