// מפגש בעפ 5 — Ariel's notes from the lesson, transcribed verbatim.
//
// Same contract as meeting-oral-3.ts and -4.ts: `heard` is his own spelling by
// ear, `he` is his gloss. Neither is edited, completed or reordered.
//
// His instruction for this batch, 2026-08-12: *"אם אני כתבתי להם תרגום תבקש מ
// chatifai רק את הניקוד והתעתיק, אל תיתן לו לשכנע אותך על מילה אחרת לגמרי."*
// That is the standing rule, restated — chatifai gets asked for the pointing and
// the Arabic script and nothing else, and a substitution is sent back.
//
// Two things in this batch DID arrive pointed and therefore need no chatifai
// pass at all: the שו אחבארכ answers and the two directions paragraphs. They are
// in POINTED_PHRASES and DIRECTIONS below and go in immediately.

export type Heard = {
  /** Ariel's spelling, by ear, unpointed. Never edited. */
  heard: string;
  /** Ariel's gloss, exactly as written. Empty when he left it blank. */
  he: string;
  needsGloss?: boolean;
  /** Something about the line that needs him, not chatifai. */
  query?: string;
  note?: string;
};

/** היה / להיות, and the copula. */
export const BEING: Heard[] = [
  { heard: "פאת", he: "נכנס, היה" },
  { heard: "דחל", he: "נכנס", note: "כניסה = מדחל" },
  { heard: "מדחל", he: "כניסה" },
  { heard: "ביג'נם", he: "", needsGloss: true },
  { heard: "איכאן", he: "היה" },
  { heard: "איכון", he: "יהיה" },
  { heard: "כאן", he: "הוא היה" },
  { heard: "כאנאת", he: "היא הייתה" },
  { heard: "כונת", he: "אני הייתי" },
];

/** General vocabulary. */
export const GENERAL: Heard[] = [
  { heard: "אכתר", he: "יותר" },
  { heard: "בדי יאתי", he: "אני רוצה שאת" },
  { heard: "כילמה", he: "מילה" },
  { heard: "כילמה ג'דידה", he: "מילה חדשה" },
  { heard: "בורג'", he: "מגדל" },
  { heard: "פרחאן", he: "שמח" },
  { heard: "בסוהולה", he: "בקלות" },
  { heard: "עלא פיכרה", he: "דרך אגב", note: "מילולית: על הרעיון" },
  { heard: "מערוף", he: "מוכר, ידוע" },
  { heard: "ביסמו", he: "קוראים לו", note: "אריאל: bisamoo — בא מהמילה איסם" },
  { heard: "כיף", he: "כיף" },
  { heard: "טאטע", he: "סבתא", note: "כינוי לסבתא" },
  {
    heard: "שאבן עילו ליחייה",
    he: "",
    needsGloss: true,
    query: "אריאל סימן את השורה הזאת בסימן שאלה בעצמו",
  },
];

/** רפואה. */
export const HEALTH: Heard[] = [
  { heard: "מומרת", he: "אחות", note: "אחות בבית חולים" },
  { heard: "מרד", he: "מחלה" },
  { heard: "מאריד", he: "חולה" },
  { heard: "תמרד' / יתמרד'", he: "שיחק את עצמו חולה" },
  { heard: "עיאדה", he: "מרפאה" },
];

/** מחנות, פוליטיקה, תנועה. */
export const CAMPS_AND_POLITICS: Heard[] = [
  {
    heard: "מוח'יים",
    he: "מחנה (אוהלים)",
    note: "אריאל: היום זה אומר מחנה פליטים בהקשר של יו\"ש",
  },
  { heard: "ח'ימה", he: "אוהל" },
  { heard: "מח'יים אלעג'ין", he: "מחנה פליטים" },
  { heard: "מקוומה", he: "התנגדות" },
  { heard: "איסתיכלאל", he: "עצמאות" },
  { heard: "חאראכת סייאראת", he: "תנועת מכוניות" },
];

/** הכוונה בדרך — הנושא המרכזי של המפגש. */
export const DIRECTIONS_VOCAB: Heard[] = [
  { heard: "למא", he: "כש..." },
  {
    heard: "למא תטלע מן ביתי",
    he: "כשיצאת מהבית שלך",
    query: "כתבת ביתי (הבית שלי) אבל תרגמת 'הבית שלך' — בפסקה המנוקדת זה מִנְ בֵּיתַכּ",
  },
  { heard: "ח'וד ע-ימין", he: "פנה ימינה" },
  { heard: "ח'וד ע-שמאל", he: "פנה שמאלה" },
  { heard: "אמשי", he: "תמשיך (ללכת)" },
  { heard: "אמשי דע'רי", he: "תמשיך ישר" },
  { heard: "לחד מא", he: "עד ש" },
  { heard: "למא תשוף", he: "כשתראה" },
  { heard: "אטלע", he: "תצא / תעלה" },
  { heard: "אנזל", he: "רד" },
  { heard: "אדח'ול", he: "כנס" },
  { heard: "חוש", he: "כנס", note: "פחות מכובד — יעני כנס כנס" },
  { heard: "פות", he: "כנס" },
  { heard: "לף", he: "תסתובב" },
  { heard: "מפרק", he: "צומת" },
  { heard: "רציף", he: "מדרכה", note: "חוזר גם ממפגש בעפ 4" },
  { heard: "ויצל", he: "הגיע" },
  { heard: "לחד מא תוצל ע רמזון", he: "עד שתגיע לרמזור" },
  { heard: "לחד רמזון", he: "עד הרמזור" },
];

/** פעלים וביטויים נוספים. */
export const MORE: Heard[] = [
  { heard: "זעפולו", he: "תמחאו לו כפיים" },
  { heard: "זעף / יוזעוף", he: "למחוא כפיים" },
  { heard: "ע'ריר", he: "שונה, מלבד" },
  {
    heard: "ע'רירו",
    he: "חוץ ממנו, מלבדו",
    note: "אריאל: אפשר גם להגיד את זה לבד אחרי שיחה, ואז זה כמו 'מה חוץ מזה?'",
  },
  { heard: "לזם", he: "צריך" },
  { heard: "אינת לאזם תשוף", he: "אתה צריך לראות" },
  { heard: "עבוס אעינכ", he: "לנשק את העיניים שלך", note: "מחמאה" },
  { heard: "טיז'י", he: "תבואי" },
  { heard: "בידכ רוחי", he: "את רוצה ללכת" },
  { heard: "אינתו יתקררו", he: "אתם מחליטים" },
];

/** אירוסין וחתונה — אוצר המילים של הסרטון. */
export const ENGAGEMENT: Heard[] = [
  { heard: "חטיב", he: "ארוס" },
  { heard: "חטיבה", he: "ארוסה" },
  { heard: "חטיבתו", he: "ארוסתו" },
  { heard: "בתפה", he: "משלם" },
  { heard: "דפה", he: "שילם / דחף" },
  { heard: "עזאם", he: "הזמין" },
  { heard: "חכה", he: "דיבור" },
  { heard: "חכתילו", he: "אמרה לו", note: "אריאל: זה חכתלו בתכלס, מעוותים את זה לחכתילו" },
  { heard: "חכיתילכ", he: "אמרתי לך", note: "אריאל: אמור היה להיות אחרת אבל זה יותר מתגלגל" },
  { heard: "שארת", he: "תנאי" },
  { heard: "באס ב שארת", he: "רק בתנאי" },
  { heard: "שפם", he: "שווארב" },
  { heard: "ליח'יה", he: "זקן", note: "שיער פנים" },
  { heard: "עללהא", he: "אמר לה" },
  { heard: "ווז'", he: "פרצוף" },
  { heard: "עיב", he: "בושה" },
  { heard: "מיש עיב", he: "לא בושה", note: "לא מתבייש" },
  {
    heard: "ווז' היא ליח'יה",
    he: "בפנים שלי שפם",
    query: "התרגום לא מתיישב עם המילים — בסרטון זה 'ופי בוג'הי שווארב'. מה בדיוק אמרו?",
  },
  { heard: "זיי מא בידק", he: "מה שאתה רוצה" },
];

export const ALL_ORAL_5: Heard[] = [
  ...BEING,
  ...GENERAL,
  ...HEALTH,
  ...CAMPS_AND_POLITICS,
  ...DIRECTIONS_VOCAB,
  ...MORE,
  ...ENGAGEMENT,
];

// ---------------------------------------------------------------------------
// Already pointed — no chatifai pass needed
// ---------------------------------------------------------------------------

/**
 * Answers to שוּ אַחְ'בַּארַכּ. Ariel supplied these already pointed, with the gloss
 * and the register note attached, so they go in as they are.
 */
export const POINTED_PHRASES: { translit: string; he: string; note: string }[] = [
  {
    translit: "מַא פִיש אִשִי גְ'דִיד",
    he: "שום דבר חדש",
    note: "התשובה הנפוצה ל-שוּ אַחְ'בַּארַכּ · מַא פִיש = אין · אִשִי = דבר · גְ'דִיד = חדש",
  },
  {
    translit: "פִש אִשִי",
    he: "אין כלום",
    note: "הגרסה הקצרה והנפוצה — כשעונים מהר ובקלילות",
  },
  {
    translit: "צַאפְיֵה וַאפְיֵה",
    he: "הכל שקט, אין חדשות מיוחדות",
    note: "מילולית: צלולה ומספיקה. ביטוי ציורי, נפוץ מאוד ברחוב",
  },
  {
    translit: "עַלַא חַאלוֹ",
    he: "על מצבו — שום דבר לא השתנה",
    note: "בדרך כלל מוסיפים אחריו אִלְחַמְדֻלִלַה",
  },
];

/**
 * The two directions paragraphs, pointed as Ariel supplied them. This is the
 * exercise the whole lesson built to — every direction word above appears in it
 * in context, which is the thing a word list cannot teach.
 */
export const DIRECTIONS: string[] = [
  "לַמַא תִטְלַע מִנְ בֵּיתַכּ, חֻ'וד עַ-(א)לְיַמִין וְאִמְשִי דֻעְ'רִי עַ-(אל)רַּצִיף אִלִי לוֹנוֹ אַבְּיַצ' וְאַסְוַד. לַמַא תְשוּפ מַפְרַקִ (אל)טֻרֻק, לִף עַ-(א)לִשְמַאל. הֻנַאכּ פִי חַרַכֵּת סַיַּארַאת כְּתִירֵה קֻדַּאמַכּ. עַלַא פִכְּרַה, בַּעְדֵין אִנְזַל פִי (אל)נַזְלֵה לַחַדִ מַא תוּצַל לַ(א)לְעִיַאדֵה אִלִי לוֹנְהַא אַחְ'צַ'ר.",
  "בַּעְדֵין, אִמְשִי דֻעְ'רִי לַחַדִ מַא תְשוּפ שַגַ'רַה כְּבִּירֵה. עַלַא פִכְּרַה, פִש הֻנַאכּ רַמְזוֹן, בַּס פִי דַוַאר זְעִ'יר",
];
