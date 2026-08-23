// Where each Arabic letter is pronounced in the מפגש 1 alphabet recordings
// (note 28e16a9b).
//
// The ranges were read off the word-level transcripts, not matched by name:
// Whisper's Hebrew mangles the letter names badly — ج comes out "ז'ים", خ comes
// out "ח", ص comes out "הא צ", غ comes out "רן" — so name matching found six
// letters and mis-assigned two of them. The teacher walks the alphabet in
// order, though, and the content of each passage is unambiguous, so each range
// is anchored to what he actually says. `note` records that sentence, which is
// what makes a wrong range checkable without listening to all ten minutes.
//
// Two recordings, in alphabet order:
//   A — "מפגש 1 – האותיות בכתב הערבי"   ا … ط
//   B — "מפגש 1 – האות ז'א"              ظ … ي

export const REC_A = "015474b8-1c57-475c-8a05-7abe97330581";
export const REC_B = "57f341f2-fe08-4121-ad28-6cb78aba2553";

export type LetterClip = {
  letter: string;
  recording: string;
  start: number;
  end: number;
  /** The teacher's own words at that point, as the transcript has them. */
  note: string;
};

export const LETTER_CLIPS: LetterClip[] = [
  { letter: "ا", recording: REC_A, start: 40.4, end: 60.3, note: "נתחיל מהאות א׳ — מבוטאת כמו א׳ בעברית, ומשמשת גם כאם קריאה" },
  { letter: "ب", recording: REC_A, start: 60.3, end: 85.3, note: "ב׳ דגושה בלבד; ב׳ רפויה לא קיימת בערבית — ולכן 'תל אביב' יוצא 'תל אביב/אפיף'" },
  { letter: "ت", recording: REC_A, start: 85.3, end: 91.8, note: "תה — כתי״ו דגושה" },
  { letter: "ث", recording: REC_A, start: 91.8, end: 117.1, note: "ת׳א — במדוברת פחות משומשת, נהגית כסמך או כתי״ו דגושה; הלשון טיפה בחוץ" },
  { letter: "ج", recording: REC_A, start: 117.1, end: 136.6, note: "ג׳ים — כמו במילה 'מזנון'; יש גם שאומרים מג׳נון" },
  { letter: "ح", recording: REC_A, start: 136.6, end: 149.5, note: "ح — ח׳ גרונית חדה מזרחית, ממעמקי הגרון" },
  { letter: "خ", recording: REC_A, start: 149.5, end: 169.4, note: "خ — כמו כ״ף רפויה בעברית, לא כמו ח׳ האשכנזית" },
  { letter: "د", recording: REC_A, start: 169.4, end: 176.6, note: "דאל — דל״ת רגילה, כמו בעברית" },
  { letter: "ذ", recording: REC_A, start: 176.6, end: 196.7, note: "ד׳אל — בעיקר בספרותית; במדוברת כדל״ת רגילה, ובכפרי ובדואי כזי״ן" },
  { letter: "ر", recording: REC_A, start: 196.7, end: 216.5, note: "רא — ר׳ מזרחית, הלשון קדימה ממש בקדמת החך" },
  { letter: "ز", recording: REC_A, start: 216.5, end: 224.0, note: "זאי — כמו זי״ן בעברית, רגיל לחלוטין" },
  { letter: "س", recording: REC_A, start: 224.0, end: 230.3, note: "סין — כמו סמ״ך, רגיל לחלוטין" },
  { letter: "ش", recording: REC_A, start: 230.3, end: 236.4, note: "שין — כמו שי״ן בעברית" },
  { letter: "ص", recording: REC_A, start: 236.4, end: 262.0, note: "צאד — נכתבת צ׳ אבל אינה הצד״י המודרנית: ס׳ עבה, חלל הפה מתעבה" },
  { letter: "ض", recording: REC_A, start: 262.0, end: 288.9, note: "צ׳אד — כמו דל״ת עבה; ייחודית לערבית ולא קיימת בשפות אחרות" },
  { letter: "ط", recording: REC_A, start: 288.9, end: 307.0, note: "טא — ט׳ מזרחית, טי״ת דגושה ונחצית, עבה" },

  { letter: "ظ", recording: REC_B, start: 0.2, end: 20.3, note: "ט׳א — נכתבת ט׳ עם קו למעלה; זי״ן נחצית, ולעיתים כדל״ת" },
  { letter: "ع", recording: REC_B, start: 20.3, end: 27.3, note: "עין — גרונית, ממעמקי הגרון" },
  { letter: "غ", recording: REC_B, start: 27.3, end: 74.3, note: "ע׳ין — כמו ר׳ צרפתית, הלשון אחורית; נכתבת עין עם קו למעלה" },
  { letter: "ف", recording: REC_B, start: 74.3, end: 93.9, note: "פא — תמיד פ׳ רפויה; פ׳ דגושה לא קיימת, ולכן 'פיטה' יוצא 'ביטה'" },
  { letter: "ق", recording: REC_B, start: 93.9, end: 157.3, note: "קאף — שלוש הגיות: ק׳ גרונית בכפרים, א׳ בעירונית, ג׳ בבדואית (קלב / אלב / גלב)" },
  { letter: "ك", recording: REC_B, start: 157.3, end: 176.2, note: "כאף — כ״ף דגושה; חלק מהכפריים הוגים צ׳ (כלב ← צ׳לב)" },
  { letter: "ل", recording: REC_B, start: 176.2, end: 180.0, note: "לאם — כמו בעברית לחלוטין" },
  { letter: "م", recording: REC_B, start: 180.0, end: 183.3, note: "מים — כמו בעברית לחלוטין" },
  { letter: "ن", recording: REC_B, start: 183.3, end: 189.4, note: "נון — כמו בעברית לחלוטין" },
  { letter: "ه", recording: REC_B, start: 189.4, end: 210.4, note: "הא — חשוב להגות כה״א ממש, כמו h באנגלית; לא לבלבל עם א׳ וע׳" },
  { letter: "و", recording: REC_B, start: 210.4, end: 255.9, note: "ואו — כמו W באנגלית; ו׳ רפויה לא קיימת. משמשת גם כאם קריאה (יוֹם)" },
  { letter: "ي", recording: REC_B, start: 255.9, end: 268.1, note: "יא — כמו בעברית; משמשת גם כאם קריאה לתנועה ארוכה" },
];
