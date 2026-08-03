// מפגש 5 — transcribed from the book pages Ariel photographed (pp. 68-75)
// plus his own lesson notes.
//
// Everything here is READ OFF THE PAGE, not composed. The book is already
// pointed, so the nikud is the book's. Ariel's notes add words the book does not
// list; those are marked `source: "notes"` and carry no nikud where he wrote
// them unpointed — chatifai supplies it, never this file.
//
// Nothing here is inserted until chatifai has ruled on it.

export type Source = "book" | "notes";

export type Vocab = {
  translit: string;
  he: string;
  /** plural, as the book gives it */
  plural?: string;
  source: Source;
  /** set when Ariel wrote it unpointed and the nikud must come from chatifai */
  needsNikud?: boolean;
  note?: string;
};

/** The three possession words and how they differ — the whole point of מפגש 5.
 *  From the explanation page (written by גלעד כ.). */
export const POSSESSION_RULES = {
  words: {
    "עִנְד": "אצלי / יש לי",
    "מַע": "עימי / עלי / איתי",
    "אִל": "יש לי (שייכות)",
  },
  rule_after:
    "כינוי גוף שמגיע אחרי שם העצם מציין משמעות ספציפית: " +
    "אִ(ל)סַיַّארַה עִנְדִי = המכונית אצלי (כעת) · " +
    "אִ(ל)סַיַّארַה מַעִי = המכונית עימי/איתי (כעת) · " +
    "אִ(ל)סַיַّארַה אִלִי = המכונית (המדוברת) שייכת לי",
  rule_before:
    "כינוי גוף שמגיע לפני שם העצם משמעותו: יש לי. " +
    "עִנְדִי סַיַّארַה / מַעִי סַיַّארַה / אִלִי סַיַّארַה = יש לי מכונית (באופן כללי)",
  negation_before: "מַא עִנְדִי / מַעִנְדִיש · מַא מַעִי / מַעִיש · מַא אִלִי / מַלִיש",
  negation_after: "אִ(ל)סַיַّארַה מֵש עִנְדִי / מֵש מַעִי / מֵש אִלִי",
};

export type Row = { person: string; positive: string; negative: string; variant?: string };

/** p.68 — נטיית אִלִי (יש לי) בחיוב ובשלילה. Book example noun: דַפְתַר */
export const ILI: Row[] = [
  { person: "אַנַא", positive: "אִלִי", negative: "מַא אִלִי / מַלִיש" },
  { person: "אִנְתֵ", positive: "אִלַכּ", negative: "מַא אִלַכּ / מַלְכִּש" },
  { person: "אִנְתִי", positive: "אִלֵכּ", negative: "מַא אִלֵכּ / מַלְכִּש" },
  { person: "הֻוֵّ", positive: "אִלוֹ", negative: "מַא אִלוֹ / מַלוֹש" },
  { person: "הִיֵّ", positive: "אִלְהַא", negative: "מַא אִלְהַא / מַלְהַאש", variant: "אִלַא" },
  { person: "אִחְנַא", positive: "אִלְנַא", negative: "מַא אִלְנַא / מַלְנַאש" },
  { person: "אִנְתוּ", positive: "אִלְכֹּם", negative: "מַא אִלְכֹּם / מַלְכֹּמְש" },
  { person: "הֵםّ", positive: "אִלְהֹם", negative: "מַא אִלְהֹם / מַלְהֹמְש" },
];

/** p.69 — נטיית עִנְד (יש ל..). Book example noun: סַיַّארַה */
export const IND: Row[] = [
  { person: "אַנַא", positive: "עִנְדִי", negative: "מַא עִנְדִי / מַעִנְדִיש" },
  { person: "אִנְתֵ", positive: "עִנְדַכּ", negative: "מַא עִנְדַכּ / מַעִנְדַכִּש" },
  { person: "אִנְתִי", positive: "עִנְדֵכּ", negative: "מַא עִנְדֵכּ / מַעִנְדֵכִּש" },
  { person: "הֻוֵّ", positive: "עִנְדוֹ", negative: "מַא עִנְדוֹ / מַעִנְדוֹש" },
  { person: "הִיֵّ", positive: "עִנְדְהַא", negative: "מַא עִנְדְהַא / מַעִנְדְהַאש", variant: "עִנְדַא" },
  {
    person: "אִחְנַא",
    positive: "עִנַּא",
    negative: "מַא עִנַּא / מַעִנַּאש",
    variant: "עִנְדְנַא — הספר מציין את שתי הצורות; עִנַّא היא הנוחה בדיבור",
  },
  { person: "אִנְתוּ", positive: "עִנְדְכֹּם", negative: "מַא עִנְדְכֹּם / מַעִנְדְכֹּמְש" },
  { person: "הֵםّ", positive: "עִנְדְהֹם", negative: "מַא עִנְדְהֹם / מַעִנְדְהֹמְש", variant: "עִנְדֹם" },
];

/** p.70 — נטיית מַע (עמי, איתי, עלי). Book example noun: רֵחְ'צַה */
export const MAA: Row[] = [
  { person: "אַנַא", positive: "מַעִי", negative: "מַא מַעִי / מַעִיש", variant: "מַעַאיְ" },
  { person: "אִנְתֵ", positive: "מַעַכּ", negative: "מַא מַעַכּ / מַעַכִּש", variant: "מַעַאכּ" },
  { person: "אִנְתִי", positive: "מַעֵכּ", negative: "מַא מַעֵכּ / מַעֵכִּש", variant: "מַעַאכִּי" },
  { person: "הֻוֵّ", positive: "מַעוֹ", negative: "מַא מַעוֹ / מַעוֹש", variant: "מַעַאה" },
  { person: "הִיֵّ", positive: "מַעַא", negative: "מַא מַעַאהַא / מַעְהַאש", variant: "מַעַאהַא" },
  { person: "אִחְנַא", positive: "מַעְנַא", negative: "מַא מַעְנַא / מַעְנַאש", variant: "מַעַאנַא" },
  { person: "אִנְתוּ", positive: "מַעְכֹּם", negative: "מַא מַעְכֹּם / מַעְכֹּמְש", variant: "מַעַאכֹּם" },
  { person: "הֵםّ", positive: "מַעְהֹם", negative: "מַא מַעְהֹם / מַעְהֹמְש", variant: "מַעַאהֹם" },
];

/** p.72 — נטיית אַבּ ו-אַח', on the bases אַבּוּ- and אַח'וּ- */
export const AB_AKH: { person: string; ab: string; akh: string }[] = [
  { person: "אַנַא", ab: "אַבּוּי", akh: "אַח'וּי" },
  { person: "אִנְתֵ", ab: "אַבּוּכּ", akh: "אַח'וּכּ" },
  { person: "אִנְתִי", ab: "אַבּוּכִּי", akh: "אַח'וּכִּי" },
  { person: "הֻוֵّ", ab: "אַבּוּה", akh: "אַח'וּה" },
  { person: "הִיֵّ", ab: "אַבּוּהַא", akh: "אַח'וּהַא" },
  { person: "אִחְנַא", ab: "אַבּוּנַא", akh: "אַח'וּנַא" },
  { person: "אִנְתוּ", ab: "אַבּוּכֹּם", akh: "אַח'וּכֹּם" },
  { person: "הֵםّ", ab: "אַבּוּהֹם", akh: "אַח'וּהֹם" },
];

/** p.73 — אִלְאַלְוַאן, the colours. Pattern: אַפְעַל / פַעְלַא / פֻעוּל */
export const COLOURS: { m: string; f: string; pl: string; he: string }[] = [
  { m: "אַצְפַר", f: "צַפְרַא", pl: "צֻפֹר", he: "צהוב" },
  { m: "אַזְרַק", f: "זַרְקַא", pl: "זֻרֹק", he: "כחול" },
  { m: "אַחְ'צַ'ר", f: "חַ'צְ'רַא", pl: "חֻ'צֹ'ר", he: "ירוק" },
  { m: "אַחְמַר", f: "חַמְרַא", pl: "חֻמֹר", he: "אדום" },
  { m: "אַשְקַר", f: "שַקְרַא", pl: "שֻקֹר", he: "בלונדיני" },
  { m: "אַסְמַר", f: "סַמְרַא", pl: "סֻמֹר", he: "שחרחר" },
  { m: "אַסְוַד", f: "סוֹדַא", pl: "סוּד", he: "שחור" },
  { m: "אַבְּיַצ'", f: "בֵּיצַ'א", pl: "בִּיצ'", he: "לבן" },
];

/** p.73 — צבעים נוספים, which take the -י / -יֵّה / -יִّין / -יַّאת pattern */
export const COLOURS_EXTRA: { m: string; f: string; he: string }[] = [
  { m: "עַסַלִי", f: "עַסַלִיֵّה", he: "חום (דבש)" },
  { m: "קַמְחִי", f: "קַמְחִיֵّה", he: "חום (חיטה)" },
  { m: "רַמַאדִי", f: "רַמַאדִיֵّה", he: "אפור" },
  { m: "סַכַּנִי", f: "סַכַּנִיֵّה", he: "אפור" },
  { m: "רַצַאצִי", f: "רַצַאצִיֵّה", he: "אפור" },
  { m: "בֻּנִّי", f: "בֻּנִّיֵّה", he: "חום" },
  { m: "שַטִינִי", f: "", he: "שטני, חום בהיר" },
  { m: "בֻּרְתֻקַאלִי", f: "בֻּרְתֻקַאלִיֵّה", he: "כתום" },
  { m: "בֻּרְדְקַאנִי", f: "בֻּרְדְקַאנִיֵّה", he: "כתום" },
  { m: "בַּנַפְסַגִ'י", f: "בַּנַפְסַגִ'יֵّה", he: "סגול" },
  { m: "לֵילַכִּי", f: "לֵילַכִּיֵّה", he: "סגול" },
  { m: "וַרְדִי", f: "וַרְדִיֵّה", he: "ורוד" },
  { m: "זַהְרִי", f: "זַהְרִיֵّה", he: "ורוד" },
  { m: "פִצְّי", f: "פִצְّיֵّה", he: "כסוף" },
  { m: "דַהְבִּי", f: "דַהְבִּיֵّה", he: "מוזהב" },
  { m: "סַמַאוִי", f: "סַמַאוִיֵّה", he: "תכלת" },
  { m: "בַּטוֹנִי", f: "", he: "צבע בטון" },
];

/** p.73 — שמות תואר הקשורים לצבעים */
export const COLOUR_ADJECTIVES: Vocab[] = [
  { translit: "שַפַّאף", he: "שקוף", source: "book" },
  { translit: "מְלַוַّן", he: "צבעוני", source: "book" },
  { translit: "פַאתֵח", he: "בהיר", source: "book" },
  { translit: "עַ'אמֵק", he: "כהה", source: "book" },
  { translit: "לַאמֵע", he: "בוהק, מבריק", source: "book" },
];

/** pp.74-75 — אוצר מילים מפגש 5, the numbered list, in the book's own pointing */
export const BOOK_VOCAB: Vocab[] = [
  { translit: "מַצַארִי", he: "כסף", source: "book", note: "גם פְלוּס" },
  { translit: "פְלוּס", he: "כסף", source: "book" },
  { translit: "אַבּוּ", he: "בעל (תכונה, סימן אופייני), אבא של.., בערך, בסביבות", source: "book" },
  { translit: "נַצַّארַאת", he: "משקפיים", source: "book" },
  { translit: "נַצַّארַה", he: "משקפת", source: "book" },
  { translit: "מַעְלַקַה", he: "כף", plural: "מַעַאלֵק", source: "book" },
  { translit: "מַעְלַקַה זְעִ'ירַה", he: "כפית", source: "book" },
  { translit: "סַכִּינֵה", he: "סכין", plural: "סַכַּאכִּין", source: "book" },
  { translit: "טַנְגַ'רַה", he: "סיר", plural: "טַנַאגֵ'ר", source: "book" },
  { translit: "שַוַארֵבּ", he: "שפם", source: "book" },
  { translit: "צוּרַה", he: "תמונה", plural: "צֻוַר", source: "book" },
  { translit: "צַחֵן", he: "צלחת", plural: "צְחוּן", source: "book" },
  { translit: "צַנְדוּק", he: "תיבה, קופה", plural: "צַנַאדִיק", source: "book" },
  { translit: "בֵּלֵפוֹן", he: "פלאפון", plural: "בֵּלֵפוֹנַאת", source: "book" },
  { translit: "לִיסְתַה", he: "רשימה", plural: "לִיסְתַאת", source: "book" },
  { translit: "טַאקִיֵّה", he: "כובע", plural: "טַוַאקִי", source: "book" },
  { translit: "אַרְצ'", he: "אדמה", plural: "אַרַאצִ'י", source: "book" },
  { translit: "רֵחְ'צַה", he: "רישיון, אישור", plural: "רֻחַ'ץ", source: "book" },
  { translit: "קַרִיבּ", he: "קרוב משפחה, קרוב (במרחק)", plural: "קַרַאיֵבּ", source: "book" },
  { translit: "מֻמְכֵּן", he: "אולי, אפשרי", source: "book", note: "גם יֻמְכֵּן, בַּלְכִּי" },
  { translit: "יֻמְכֵּן", he: "אולי, אפשרי", source: "book" },
  { translit: "בַּלְכִּי", he: "אולי, אפשרי", source: "book" },
  { translit: "מִסְכִּין", he: "מסכן", plural: "מַסַאכִּין", source: "book" },
  { translit: "בַּס", he: "רק", source: "book", note: "גם פַקַט, אִלַّא" },
  { translit: "פַקַט", he: "רק", source: "book" },
  { translit: "יַתִים", he: "יתום", plural: "אַיְתַאם", source: "book" },
  { translit: "חְסַאבּ", he: "חשבון", plural: "חְסַאבַּאת", source: "book" },
  { translit: "אַו", he: "או", source: "book", note: "אַו לאמירה, וְלַّא לשאלה" },
  { translit: "וְלַّא", he: "או (בשאלה)", source: "book" },
  { translit: "מְקַאבַּלֵה", he: "פגישה", plural: "מְקַאבַּלַאת", source: "book" },
  { translit: "לְקַא", he: "פגישה", plural: "לְקַאאַת", source: "book" },
  { translit: "גְ'זְדַאן", he: "ארנק", plural: "גְ'זַאדִין", source: "book" },
  { translit: "מַרְכַּז", he: "מרכז", plural: "מַרַאכֵּז", source: "book" },
  { translit: "קַלְבּ", he: "לב", plural: "קְלוּבּ", source: "book" },
  { translit: "נַפְס", he: "נפש, רצון, נשמה, חשק", plural: "נְפוּס", source: "book" },
  { translit: "אִשִי", he: "דבר מה, משהו, חפץ, עניין", plural: "אַשְיַא", source: "book" },
  { translit: "תַאנִי", he: "שני, אחר", source: "book" },
  { translit: "תַאנְיֵה", he: "שנייה, אחרת", source: "book" },
  { translit: "וַאחַד", he: "אחד", source: "book" },
  { translit: "לַאבֵּס", he: "לובש", plural: "לַאבְּסִין", source: "book" },
  { translit: "לַאבְּסֵה", he: "לובשת", plural: "לַאבְּסַאת", source: "book" },
  { translit: "רַאס", he: "ראש", plural: "רוּס", source: "book" },
  { translit: "מְהֵםّ", he: "חשוב, משמעותי", source: "book" },
  { translit: "מְהֵמֵّה", he: "חשובה, משמעותית", source: "book" },
  { translit: "הַםّ", he: "דאגה, צער", plural: "הְמוּם", source: "book" },
  { translit: "כְּלְמֵה", he: "מילה", plural: "כַּלַמַאת", source: "book" },
  { translit: "כַּלַאם", he: "דיבורים (שם קיבוצי)", source: "book" },
  { translit: "מְכַּאלַמֵה", he: "שיחה", plural: "מְכַּאלַמַאת", source: "book" },
  { translit: "עַארֵף", he: "יודע", plural: "עַארְפִין", source: "book" },
  { translit: "עַארְפֵה", he: "יודעת", plural: "עַארְפַאת", source: "book" },
  { translit: "שַאיֵף", he: "רואה", plural: "שַאיְפִין", source: "book" },
  { translit: "שַאיְפֵה", he: "רואה (נ)", plural: "שַאיְפַאת", source: "book" },
  { translit: "רַקַם", he: "מספר", plural: "אַרְקַאם", source: "book" },
  { translit: "מַוְצ'וּע", he: "נושא", plural: "מַוַאצִ'יע", source: "book" },
  { translit: "וַצְ'ע", he: "מצב", plural: "אַוְצַ'אע", source: "book" },
  { translit: "מְנִיח", he: "טוב", plural: "מְנַאח", source: "book" },
  { translit: "מְנִיחַה", he: "טובה", source: "book" },
  { translit: "חַאל", he: "מצב, מקרה", plural: "אַחְוַאל", source: "book" },
  { translit: "כִּיף", he: "איך", source: "book" },
  { translit: "כֵּיף", he: "הנאה, תענוג", source: "book" },
  { translit: "מַאשִי", he: "הולך (משמש גם: בסדר)", plural: "מַאשְיִין", source: "book" },
  { translit: "מַאשְיֵה", he: "הולכת", plural: "מַאשְיַאת", source: "book" },
  { translit: "צַרַאחַה", he: "כנות, גילוי לב", source: "book" },
  { translit: "טַיֵّבּ", he: "טוב, בסדר", source: "book", note: "משמש גם במילה קצרה — טַבּ" },
  { translit: "תַמַאם", he: "מושלם, שלם, שלמות, בדיוק", source: "book" },
  { translit: "וְלַא", he: "שום, אף אחד, ולא", source: "book" },
  { translit: "מַטְ'בּוּט", he: "מדויק, נכון", plural: "מַטְ'בּוּטִין", source: "book" },
  { translit: "מַטְ'בּוּטַה", he: "מדויקת, נכונה", plural: "מַטְ'בּוּטַאת", source: "book" },
];

/** Words from Ariel's own notes that the book list does not carry. Unpointed
 *  where he wrote them unpointed — chatifai supplies the nikud. */
export const NOTES_VOCAB: Vocab[] = [
  { translit: "כויס", he: "טוב / בסדר / יפה / סבבה", source: "notes", needsNikud: true },
  { translit: "מלאן", he: "מלא", source: "notes", needsNikud: true },
  { translit: "מלאנה", he: "מלאה", source: "notes", needsNikud: true },
  { translit: "דבאח", he: "שוחט", source: "notes", needsNikud: true },
  { translit: "פכרה", he: "רעיון", source: "notes", needsNikud: true, note: "אריאל כתב 'פיכרה'" },
  { translit: "נציחה", he: "עצה", source: "notes", needsNikud: true, note: "אריאל כתב 'מציחה'" },
  { translit: "שרף", he: "כבוד", source: "notes", needsNikud: true },
  { translit: "רוצ'ה", he: "גן (לרוב גן ילדים)", source: "notes", needsNikud: true },
  { translit: "ראח", he: "הלך", source: "notes", needsNikud: true },
  { translit: "תקריבן", he: "בערך", source: "notes", needsNikud: true, note: "גם חַוַאלִי, גם אַבּוּ" },
  { translit: "מסכינה", he: "מסכנה", source: "notes", needsNikud: true },
  { translit: "יתימה", he: "יתומה", source: "notes", needsNikud: true },
  { translit: "נפס אשי", he: "אותו דבר", source: "notes", needsNikud: true },
  { translit: "נפסי", he: "מאוד רוצה (חזק מבִּדִּי)", source: "notes", needsNikud: true },
  { translit: "וללהי", he: "ואללה (הדגשה חזקה יותר)", source: "notes", needsNikud: true },
  { translit: "צראחה", he: "כנות", source: "notes", needsNikud: true },
  { translit: "ג'יסר", he: "גשר", source: "notes", needsNikud: true },
  { translit: "מצ'די", he: "חלוד / ג'ינג'י (סלנג, תלוי בטון)", source: "notes", needsNikud: true },
  { translit: "צ'דא", he: "חלודה", source: "notes", needsNikud: true },
  { translit: "דהב", he: "זהב", source: "notes", needsNikud: true },
  { translit: "אציר", he: "קצר", source: "notes", needsNikud: true },
  { translit: "עציר", he: "מיץ", source: "notes", needsNikud: true },
  { translit: "ח'בר", he: "מושג", source: "notes", needsNikud: true, note: "מַלִיש חְ'בַּר = אין לי מושג" },
  { translit: "שאטר", he: "חכם", source: "notes", needsNikud: true, note: "רבים: שאטרין" },
  { translit: "דואר", he: "כיכר", source: "notes", needsNikud: true },
  { translit: "מוקף", he: "חניון", source: "notes", needsNikud: true },
  { translit: "דכאן", he: "חנות", source: "notes", needsNikud: true, note: "רבים: דכאכין" },
  { translit: "סכניה", he: "כסופה", source: "notes", needsNikud: true },
  { translit: "הויה", he: "תעודת זהות", source: "notes", needsNikud: true },
  { translit: "קבל סעתין", he: "לפני שעתיים", source: "notes", needsNikud: true },
  { translit: "בנכ תאני", he: "בנק אחר", source: "notes", needsNikud: true },
  { translit: "נאס טיבין", he: "אנשים טובים", source: "notes", needsNikud: true },
];

/** Grammar points from Ariel's notes that are not vocabulary. */
export const NOTES_GRAMMAR = [
  "שתי דרכים לשלול 'אחד': וְלַא חַדַא · מַא חַדַאש",
  "מתי אִלִי: כשמדגישים בעלות על משהו לא פיזי — אִלִי פִכְרַה, יש לי הצעה",
  "עִנְד = קניין/שייכות/אצל. מַע = מה שעליי פיזית כרגע (כסף, מפתחות, אוזניות). " +
    "היוצא דופן היחיד הוא רכב — תמיד עם מַעַכּ",
  "מֵש שולל שם עצם או מילת יחס של מקום/זמן: מֵש עַלַא סַטֵח, מֵש כְּבִּיר, מֵש כַּמְבְּיוּתֵר",
  "שלוש דרכי שלילה: פִיש + הטיה · מַא + ־ש · מַא בלי ־ש (הכי פחות נפוץ)",
  "במקום עִנְדְנַא אומרים עִנַّא בשדה על ה-נ, לנוחות",
  "צבעים עובדים בשלושה משקלים: אַפְעַל (ז) · פַעְלַא (נ) · פֻעוּל (ר)",
  "כשע' הפועל היא ו או י הצורה שונה: אַבְּיַצ' / בֵּיצַ'א / בִּיצ'. גם אַסְוַד כך",
  "אין ריבוי לצבעים על ריבוי שאינו אנושי — מתייחסים כנקבה יחידה: סַיַّארַאת צַפְרַא",
  "אומרים אַסְמַר על אנשים כהים או שיער; על שמות עצם אומרים אַסְוַד",
  "נטיית אַבּ ו-אַח' על הבסיסים אַבּוּ- ו-אַח'וּ-. באַבּוּה לא הוגים את ה-ה, מאריכים את ה-ו",
  "בֻּרְתֻקַאל/בֻּרְדְקַאן = תפוז — מפורטוגל, משם השם. מועמד לטיפ היומי",
];
