// The official "אוצר מילים - מפגש 4" list, items 1-62, transcribed from the
// course book pages the user photographed on 2026-07-31.
//
// This is the reference the DB is audited against — NOT a source to insert from.
// Anything missing gets its vocalisation confirmed by chatifai before it becomes
// a card, because a photo transcription is not a verified source.

export type BookEntry = {
  n: number;
  /** headword as printed, nikud included */
  translit: string;
  he: string;
  /** printed plural, where the book gives one */
  plural?: string;
  /** feminine form printed alongside */
  feminine?: string;
  note?: string;
};

export const MEETING4_BOOKLIST: BookEntry[] = [
  { n: 1, translit: "וַרַא", he: "אחרי, מאחרי" },
  { n: 2, translit: "קֻדַּאם", he: "לפני" },
  { n: 3, translit: "תַחְת", he: "תחת, מתחת, למטה" },
  { n: 4, translit: "פוֹק", he: "מעל, על, למעלה" },
  { n: 5, translit: "קְבַּאל", he: "מול" },
  { n: 6, translit: "חַוַאלִי", he: "בערך, סביב" },
  { n: 7, translit: "הוֹן", he: "פה" },
  { n: 8, translit: "הֻנַאכּ", he: "שם" },
  { n: 9, translit: "בַּרַّא", he: "חוץ, בחוץ" },
  { n: 10, translit: "גֻ'וַّא", he: "פנימה, בפנים" },
  { n: 11, translit: "לַחַדּ / לַ", he: "עד" },
  { n: 12, translit: "בַּס", he: "זהו, מספיק, אבל" },
  { n: 13, translit: "מִתֵל / זַיּ", he: "כמו" },
  { n: 14, translit: "בַּעַד", he: "אחרי (לזמן ולמקום)" },
  { n: 15, translit: "קַבֵּל", he: "לפני (לזמן ולמקום)" },
  { n: 16, translit: "חַתַّא / תַ", he: "עד ש..., כדי ש...", note: "אפילו — חַתַّא לא מגיע בקיצור" },
  { n: 17, translit: "דֻעְ'רִי", he: "ישר, מיד" },
  { n: 18, translit: "אִלִّי", he: "אשר, ש..." },
  { n: 19, translit: "פִשׁ", he: "אין", note: "= מַפִשׁ = מַפִיש = מַא פִי" },
  { n: 20, translit: "אַמַّא", he: "אבל" },
  { n: 21, translit: "עִדֵّת", he: "מספר, מניין (של פריטים)", note: "נסמך לשם עצם לא מיודע ברבים" },
  { n: 22, translit: "עַדַד", he: "מספר, מניין (של פריטים)", note: "נסמך לשם עצם מיודע ברבים" },
  { n: 23, translit: "מַדְחַ'ל", he: "כניסה, פתח", plural: "מַדַאחֵ'ל", note: "גם: פֻתְחֵה (ר) פֻתַאת" },
  { n: 24, translit: "רַוְצַ'ה", he: "גן (ילדים)", plural: "רַוְצַ'את" },
  { n: 25, translit: "רַוְצַ'ת אַטְפַאל", he: "גן ילדים" },
  { n: 26, translit: "טִפֵל", he: "תינוק, פעוט", plural: "אַטְפַאל" },
  { n: 27, translit: "שַאחְנֵה", he: "משאית", plural: "שַאחְנַאת", note: "גם: תְרַכּ (ר) תְרַכַּאת" },
  { n: 28, translit: "נַקֵל", he: "תחבורה, תעבורה, העברה, העתקה" },
  { n: 29, translit: "נַקְלֵה", he: "הובלה", plural: "נַקְלַאת" },
  { n: 30, translit: "שוֹכֵּה", he: "מזלג", plural: "שֵוַכּ", note: "בהשאלה גם: פיצול דרכים" },
  { n: 31, translit: "טַרִיק", he: "כביש, דרך", plural: "טֻרֻק" },
  { n: 32, translit: "נֻצّ", he: "חצי", plural: "נְצַאץ" },
  { n: 33, translit: "מַוְג'וּד", he: "נמצא", plural: "מַוְג'וּדִין", feminine: "מַוְג'וּדֵה" },
  { n: 34, translit: "טַאלֵע", he: "עולה, יוצא", plural: "טַאלְעִין" },
  { n: 35, translit: "טַאלְעַה", he: "עולה, יוצאת", plural: "טַאלְעַאת" },
  { n: 36, translit: "נַאזֵל", he: "יורד", plural: "נַאזְלִין" },
  { n: 37, translit: "נַאזְלֵה", he: "יורדת", plural: "נַאזְלַאת" },
  { n: 38, translit: "פַגֵ'ר", he: "שחר, עלות השחר" },
  { n: 39, translit: "צֻבֵּח", he: "בוקר" },
  { n: 40, translit: "צֻ'הֵר", he: "צהריים" },
  { n: 41, translit: "עַצֵר", he: "אחר הצהריים, תקופה, דור" },
  { n: 42, translit: "מַעְ'רֵבּ", he: "בין ערביים" },
  { n: 43, translit: "מַסַא", he: "ערב" },
  { n: 44, translit: "לֵיל", he: "לילה" },
  { n: 45, translit: "צַלַאה", he: "תפילה", plural: "צַלַוַאת" },
  { n: 46, translit: "צַ'וְ", he: "אור", plural: "אַצְ'וַאא" },
  { n: 47, translit: "עַתְמֵה", he: "חושך, אפילה" },
  { n: 48, translit: "מַלַאן", he: "מלא", feminine: "מַלַאנֵה" },
  { n: 49, translit: "פַאצִ'י", he: "ריק, פנוי", feminine: "פַאצְ'יֵה" },
  { n: 50, translit: "בִּ(א)לְמַרַّה", he: "לגמרי, בכלל" },
  { n: 51, translit: "אַצֵל", he: "מקור" },
  { n: 52, translit: "אַצְלִי", he: "מקורי", plural: "אַצְלִיִّין" },
  { n: 53, translit: "אַצְלִיֵّה", he: "מקורית", plural: "אַצְלִיַّאת" },
  { n: 54, translit: "מַוְקֵף", he: "חנייה", plural: "מַוַאקֵף" },
  { n: 55, translit: "דַאיְמַן", he: "תמיד" },
  { n: 56, translit: "עַאמוּד", he: "עמוד", plural: "עְמְדַאן" },
  { n: 57, translit: "לַחֵם", he: "בשר", plural: "לְחוּם" },
  { n: 58, translit: "מַלְחַמֵה", he: "אטליז, בית מטבחיים", plural: "מַלַאחֵם" },
  { n: 59, translit: "חֻ'בֵּז", he: "לחם" },
  { n: 60, translit: "מַחְ'בַּז", he: "מאפייה", plural: "מַחַ'אבֵּז", note: "גם: מַחְ'בַּזֵה" },
  { n: 61, translit: "מַטְעַם", he: "מסעדה", plural: "מַטַאעֵם" },
  { n: 62, translit: "כַּהְרַבַּא", he: "חשמל" },
];
