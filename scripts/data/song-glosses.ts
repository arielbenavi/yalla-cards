// chatifai's glosses for the song words that had none (note efbd5595).
//
// Found by scripts/scan-song-coverage.ts: a word with no entry in
// lyrics_parsed[].words is not a cosmetic gap — app/songs/[id]/page.tsx builds a
// line's Hebrew translation by joining its words, so the line renders with a
// silently incomplete translation.
//
// Verbatim, as always. The HOLDS below are the places where what he printed did
// not match what was sent; none of them are resolved here.
export type Gloss = {
  ar: string;
  translit: string;
  he: string;
  base?: string;
  note?: string;
};

export const SONG_GLOSSES: Gloss[] = [
  { ar: "من", translit: "מִנְ", he: "מ... / מן" },
  { ar: "دونك", translit: "דוּנַכּ", he: "בלעדיךָ", base: "דוּן (בלי/ללא)" },
  { ar: "مرة", translit: "מַרַּה", he: "פעם / אישה" },
  { ar: "يا", translit: "יַא", he: "מילת פנייה" },
  { ar: "عمري", translit: "עֻמְרִי", he: "החיים שלי (כינוי חיבה)", base: "עֻמֵר (חיים/גיל)",
    note: "chatifai: אחד מכינויי האהבה הנפוצים — 'אתה כל חיי'" },
  { ar: "بعدك", translit: "בַּעְדַכּ", he: "עדיין אתה / אחריךָ", base: "בַּעַד (עוד/אחרי)",
    note: "chatifai: בשירים כמעט תמיד 'אתה עדיין' — בַּעְדַכּ עַלַא בַּאלִי" },
  { ar: "بعد ما", translit: "בַּעַד מַא", he: "אחרי ש..." },
  { ar: "تكفي", translit: "תִכְּפִי", he: "תספיק / תמשיך (תלוי הקשר)", base: "כַּפַא (הספיק)" },
  { ar: "كله", translit: "כֻּלּוֹ", he: "הכל / כולו", base: "כֻּל (כל)" },
  { ar: "و", translit: "וּ", he: "ו... (חיבור)", note: "chatifai נתן שתי חלופות: וּ / וְ" },
  { ar: "مهدومة", translit: "מַהְדוּמֵה", he: "חמודה / מקסימה (סלנג)", base: "מַהְדוּם",
    note: "chatifai: מהשורש ה.ד.ם (נהרס) — 'הורסת' במובן החיובי" },
  { ar: "حبي", translit: "חֻבִּי", he: "אהבתי / אהובי", base: "חֻבּ (אהבה)" },
  { ar: "أعصر", translit: "אַעְצִר", he: "אני אסחט", base: "עַצַר (סחט)",
    note: "chatifai: ה-צ היא ص ולכן בלי גרש" },
  { ar: "بالليمون", translit: "בִּ(אל)לַמוּן", he: "בלימון", base: "לַמוּן (לימון)" },
  { ar: "جوابتني", translit: "גַ'אוַבַּתְנִי", he: "היא ענתה לי", base: "גַ'אוַבּ (ענה)" },
  { ar: "بالتلفون", translit: "בִּ(אל)תִלִפוֹן", he: "בטלפון", base: "תִלִפוֹן" },
  { ar: "ويلي", translit: "וֵילִי", he: "אוי לי (קריאת צער/הפתעה)", base: "וֵיל (צרה)" },
  { ar: "واللي", translit: "וִ(א)לִּי", he: "וזה ש... / ואשר", base: "אִלִּי (ש...)" },

  { ar: "جاي", translit: "גַ'אי", he: "בא / מגיע", base: "גַ'אא (בא)",
    note: "chatifai: בפלסטינית ج נהגית ג' (J); במצרית ג דגושה (G)" },
  { ar: "غاب", translit: "עַ'אבּ", he: "נעלם / נעדר" },
  { ar: "الدماغ", translit: "אִדִּמַאע'", he: "המוח / הראש", base: "דִמַאע'",
    note: "chatifai: בשירים לרוב 'מצב רוח' ולא האיבר" },
  { ar: "عيني", translit: "עֵינִי", he: "העין שלי / יקירתי", base: "עֵין" },
  { ar: "روحي", translit: "רוּחִי", he: "הנשמה שלי / אהובתי", base: "רוּח (נשמה)" },
  { ar: "واخذ", translit: "וַאחֵ'ד", he: "לוקח", base: "אַחַ'ד (לקח)",
    note: "chatifai: ذ הופכת בדרך כלל ל-ד או ז, אך כאן שומעים וַאחֵ'ד" },
  { ar: "لا", translit: "לַא", he: "לא" },
  { ar: "تروحي", translit: "תְרוּחִי", he: "תלכי (פנייה לנקבה)", base: "רַאח (הלך)" },
  { ar: "رأس", translit: "רַאס", he: "ראש" },
  { ar: "برأس", translit: "בִּרַאס", he: "בראש", base: "רַאס" },
  { ar: "وأنا", translit: "וַאַנַא", he: "ואני", base: "אַנַא" },
  { ar: "بالمصرية", translit: "בִּ(א)לְמַצְרִיֵּה", he: "במצרית", base: "מַצְרִיֵּה" },
  { ar: "مي", translit: "מַי", he: "מים (במצרית)", base: "מַיֵּה (בפלסטינית)" },
  { ar: "أمور", translit: "אֻמוּר", he: "עניינים / חמוד (סלנג)", base: "אַמֵר",
    note: "chatifai: בפלסטינית אַמוּר הוא סלנג נפוץ לילד חמוד, מלשון 'אמיר'" },
  { ar: "كل", translit: "כֻּל", he: "כל" },
  { ar: "شيء", translit: "שֵׁי", he: "דבר / משהו", note: "chatifai נתן שתי חלופות: שֵׁי / אִשִי" },
  { ar: "تقولش", translit: "תְאוּלְשׁ", he: "אל תגיד (במצרית)", base: "קַאל (אמר)",
    note: "chatifai: מבנה מצרי מובהק; בפלסטינית מַא תְאוּל או לַא תְאוּל. " +
      "ה-ق הופכת ל-א' בשני הלהגים" },
];

/**
 * Where what he printed did not match what was sent. Nothing here is resolved,
 * and nothing here should be written to the database until it is.
 */
export const HOLDS = [
  "منى — נשלח עם אליף מקצורה (בדרך כלל השם 'מונא'). הוא הדפיס مني ותרגם " +
    "'ממני', כלומר קרא את זה כמילה אחרת. צריך הכרעה על הצורה שנשלחה.",
  "بعد ו-ما — נשלחו בנפרד, הוא איחד ל-'بعد ما'. אין פסק נפרד לאף אחת מהן.",
  "جايّ — נשלח עם שדה, הוא הדפיס جاي בלי שדה. אותה מילה, אבל הכתיב שהוא " +
    "אישר הוא ללא השדה.",
];

/** Not sent for glossing, and deliberately so. */
export const SKIPPED = [
  "Immer: بابابا · با · نو · (فرر) · (همم) — ווקאליזציות, לא מילים.",
  "ZIDI: تي كييرو — ספרדית (te quiero), לא ערבית.",
  "YAMA: لويس فويتون — שם מותג.",
];
