// chatifai's ق ruling, word by word, on the actual words in the cards.
//
// This is the convention that was parked for weeks because chatifai kept
// contradicting itself. It was finally closed by stopping asking "what is the
// rule" and asking instead for a verdict on every word that exists in the
// database — ק only ever transliterates ق here (ك is כּ), so this list is the
// exact scope.
//
// NOT APPLIED YET. See BLOCKERS.
export type Ruling = { from: string; to: string; keeps_qaf?: boolean; note?: string };

/** The exceptions chatifai named. Everything else converts. */
export const EXCEPTIONS = ["קַבֵּל", "קַבְּל", "רַקַם", "זַרְקַא", "שַׁקְרַא", "קַמְחִי"];

/** Batch 1+2 — 44 of the 83 words. Verbatim. */
export const RULED: Ruling[] = [
  { from: "אֵלְחַקּ", to: "אִלְחַאּ" },
  { from: "קַלַם", to: "אַלַם" },
  { from: "קַהְוֵה", to: "אַהְוֵה" },
  { from: "קַבֵּל", to: "קַבֵּל", keeps_qaf: true },
  { from: "(א)לְקֻצַּה", to: "(א)לְאֻצַּה" },
  { from: "קַבְּל", to: "קַבְּל", keeps_qaf: true },
  { from: "קַהְוֶה", to: "אַהְוֵה" },
  { from: "קַדֵּיש", to: "אַדֵּיש" },
  { from: "(אל)טַּאבֵּק", to: "(אל)טַּאבֵּא" },
  { from: "סְוַאקַה", to: "סְוַאאַה" },
  { from: "שַקֵּת", to: "שַׁאֵּת" },
  { from: "אֵלְקֵצֵּה", to: "אִלְאֻצַּה", note: "שינה גם את התנועה" },
  { from: "קַמִיצ", to: "אַמִיץ", note: "שינה גם צ→ץ סופית" },
  { from: "(א)לְקַלַם", to: "(א)לְאַלַם" },
  { from: "לַקַבּ", to: "לַאַבּ" },
  { from: "אִקְצַתַכ", to: "אֻצַּתַכּ", note: "שינה גם תנועה וגם כ→כּ" },
  { from: "וַרַקֶה", to: "וַרַאַה" },
  { from: "מַוְקֵף", to: "מַוְאֵף" },
  { from: "נַקְלֵה", to: "נַאְלֵה" },
  { from: "קַארַאז׳", to: "אַארַאז׳" },
  { from: "מֻתְקַאעֶד", to: "מֻתַאַאעֵד", note: "שינה גם תנועות" },
  { from: "מְטַלַּק", to: "מְטַלַּא" },
  { from: "וַקֶּף", to: "וַאֵּף" },
  { from: "מַנְטַקַה", to: "מַנְטַאַה" },
  { from: "קַרְיֵה", to: "אַרְיֵה" },
  { from: "טַאבֵּק", to: "טַאבֵּא" },
  { from: "קַדִים", to: "אַדִים" },
  { from: "דַקִיקַה", to: "דַאִיאַה" },
  { from: "סַקֵף", to: "סַאַף" },
  { from: "(א)לְקַרִיבּ", to: "(א)לְאַרִיבּ" },
  { from: "קֵצֵּה", to: "אֻצַּה", note: "שינה גם את התנועה — 'אֻצַّה מדויק יותר למדוברת'" },
  { from: "שַקֵּה", to: "שַׁאֵּה" },
  { from: "קַנִּינֵה", to: "אַנִּינֵה" },
  { from: "חַקּ", to: "חַאּ" },
  { from: "קִסְמֵה", to: "אִסְמֵה" },
  { from: "סַאאֵק", to: "סַאאֵא" },
  { from: "קַמְחִי", to: "קַמְחִי", keeps_qaf: true, note: "חריג — צבע/גוון" },
  { from: "קֵפֵל", to: "אִפֵל", note: "שינה גם אֵ→אִ" },
  { from: "(א)לְבַּלְקוֹנֵה", to: "(א)לְבַּלְאוֹנֵה" },
  { from: "בֻּרְתֻקַאלִי", to: "בֻּרְתֻאַאלִי", note: "צבע, ובכל זאת מומר — 'ה-ק כמעט תמיד נופלת בערים'" },
  { from: "בֻּרְדְקַאנִי", to: "בֻּרְדְאַאנִי" },
  { from: "חַקַּכּ", to: "חַאַּכּ" },
  { from: "חַקִּי", to: "חַאִּי" },
  { from: "אֵלְחַק", to: "אִלְחַאּ" },
  { from: "מַעְלַאַה", to: "מַעְלַאַה", note: "כבר הומר בסבב הקודם" },
  { from: "לַחְלַאקַה", to: "חְלַאאַה", note: "חַלַّאא לספר" },
];

/** chatifai on the pronouns, same session. Cross-cutting — every card with "הם". */
export const PRONOUNS = [
  { he: "אני", translit: "אַנַא" },
  { he: "אתה", translit: "אִנְתֵ", note: "לא אִנְתַא" },
  { he: "את", translit: "אִנְתִי" },
  { he: "הוא", translit: "הֻוֵ", note: "לא הוּ" },
  { he: "היא", translit: "הִיֵ" },
  { he: "אנחנו", translit: "אִחְנַא", note: "ללא שינוי" },
  { he: "אתם/ן", translit: "אִנְתוּ", note: "ללא שינוי" },
  { he: "הם/ן", translit: "הֻםֵ", note: "חל תמיד. בלהג כפרי הֻנֵّה, בעירוני הֻםֵ" },
];

/** Why nothing has been written yet. */
export const BLOCKERS = [
  "39 מתוך 83 המילים טרם הוכרעו — הוחלף רק מה שנשלח. להחיל חצי יעשה את " +
    "הכרטיסים פחות עקביים ממה שהם עכשיו, לא יותר.",
  "chatifai שינה יותר מ-ق בכמה מילים: תנועות (קֵצֵّה←אֻצַّה), אֵ←אִ, " +
    "צ←ץ סופית, כ←כּ. לא ברור אם אלה חלק מההמלצה או תיקונים שהוסיף אגב. " +
    "נשאל במפורש; אלה כרטיסים שאריאל כבר לומד מהם.",
  "סתירה בכלל הצבעים: זַרְקַא/שַׁקְרַא/קַמְחִי חריגים ונשארים ק, אבל " +
    "בֻּרְתֻקַאלִי ובֻּרְדְקַאנִי — גם הם צבעים — מומרים. הוא ער לזה ונימק, " +
    "אבל הכלל עצמו לא מנוסח.",
  "התיאור של הֻםֵ לא תואם את מה שהדפיס: אמר 'ה' בחיריק' והדפיס קובוץ, " +
    "אמר 'דגש חזק ב-מ'' והדפיס בלי דגש. התעתיק שהדפיס בפועל, בכל המופעים, " +
    "הוא הֻםֵ.",
];
