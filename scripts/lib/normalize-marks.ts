// chatifai's Hebrew transliteration routinely carries Arabic diacritics where
// the Hebrew ones belong — Arabic shadda U+0651 for Hebrew dagesh U+05BC above
// all. They render identically, so pasting its output verbatim carries the wrong
// codepoint in silently, and U+0651 survives `translit_normalized`, which strips
// only [֑-ׇ]. That defeats duplicate detection on the affected cards.
//
// This is a character-identity correction, not an edit to what chatifai said:
// the same mark, the right codepoint. Every insert path should run text through
// it, rather than relying on scripts/fix-arabic-marks-in-hebrew.ts to sweep up
// afterwards — that sweep is a repair, not a guard, and I have now let the same
// defect through twice by inserting verbatim.

const AR_TO_HE_MARK: [RegExp, string][] = [
  [/ّ/g, "ּ"], // shadda → dagesh
  [/َ/g, "ַ"], // fatha  → patah
  [/ُ/g, "ֻ"], // damma  → qubuts
  [/ِ/g, "ִ"], // kasra  → hiriq
  [/ْ/g, "ְ"], // sukun  → shva
];

const HEBREW_LETTER = /[א-ת]/;
const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;

/** Only rewrites text whose letters are Hebrew; an Arabic line keeps its marks. */
export function normalizeMarks(s: string): string {
  if (!s || !HEBREW_LETTER.test(s) || ARABIC_LETTER.test(s)) return s;
  return AR_TO_HE_MARK.reduce((acc, [re, to]) => acc.replace(re, to), s);
}

/** Throws if Hebrew text still holds an Arabic mark, or the scripts are mixed. */
export function assertClean(label: string, translit: string, arabic: string): void {
  if (ARABIC_MARK.test(translit) && !ARABIC_LETTER.test(translit)) {
    throw new Error(`${label}: סימן ערבי בתעתיק העברי — ${translit}`);
  }
  if (HEBREW_LETTER.test(arabic)) throw new Error(`${label}: עברית בשדה הערבי — ${arabic}`);
  if (!ARABIC_LETTER.test(arabic)) throw new Error(`${label}: השדה הערבי בלי ערבית — ${arabic}`);
  if (ARABIC_LETTER.test(translit)) throw new Error(`${label}: ערבית בשדה התעתיק — ${translit}`);
}
