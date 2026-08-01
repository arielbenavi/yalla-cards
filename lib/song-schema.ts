/**
 * Shape check for songs.lyrics_parsed (note efbd5595).
 *
 * The note asks for every song to look like YAMA: Hebrew transliteration and
 * translation first, Arabic after, no English. Two of the eight songs do not,
 * in two different ways — Immer stores raw Arabic in the `line` field where the
 * transliteration belongs and leaves most lines with no word glosses at all,
 * and سوولنا has Hebrew transliteration sitting in every one of its `ar` slots.
 *
 * Both got in because nothing checked. This is what the collector runs before
 * writing, so the same defect cannot land again.
 */

export type LyricWord = { ar: string; he: string; translit: string };
export type LyricLine = { line: string; words: LyricWord[]; timestamp?: string };

const HEBREW = /[֐-׿]/;
const ARABIC = /[؀-ۿ]/;
const LATIN_WORD = /\b[A-Za-z]{3,}\b/;

export type SongIssue = {
  line: number;
  field: string;
  problem: string;
  value: string;
};

/**
 * Lines that are pure vocalisation or studio chatter — "بابابا", "(Unleaded)",
 * "Yeah" — legitimately have no words to gloss, so they are not reported as
 * missing glosses. They are still reported if they sit in the wrong script.
 */
function isNonLexical(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^\(.*\)$/.test(t)) return true;
  if (/^(?:ya+h?|yeah|oh+|ah+|hey|woo+)$/i.test(t)) return true;
  // Vocalisations — بابابا، لالالا، נאנאנא — are built from very few distinct
  // letters repeated. Counting distinct letters catches the alternating ones
  // that a "same character repeated" test misses.
  const letters = t.replace(/[^؀-ۿ֐-׿]/g, "");
  if (letters.length >= 4 && new Set(letters).size <= 3) return true;
  return false;
}

export function checkSong(lines: LyricLine[]): SongIssue[] {
  const issues: SongIssue[] = [];

  lines.forEach((l, i) => {
    const n = i + 1;

    // `line` is the primary display field and must be the Hebrew transliteration
    if (l.line && !HEBREW.test(l.line) && !isNonLexical(l.line)) {
      issues.push({
        line: n,
        field: "line",
        problem: ARABIC.test(l.line)
          ? "כתב ערבי בשדה שאמור להכיל תעתיק עברי"
          : "אין תעתיק עברי",
        value: l.line,
      });
    }

    if (!l.words?.length) {
      if (!isNonLexical(l.line ?? "")) {
        issues.push({ line: n, field: "words", problem: "אין פירוק למילים", value: l.line ?? "" });
      }
      return;
    }

    for (const w of l.words) {
      if (HEBREW.test(w.ar)) {
        issues.push({ line: n, field: "words.ar", problem: "עברית בשדה הערבי", value: w.ar });
      }
      if (!w.ar?.trim()) {
        issues.push({ line: n, field: "words.ar", problem: "ריק", value: w.translit ?? "" });
      }
      if (!w.he?.trim()) {
        issues.push({ line: n, field: "words.he", problem: "אין תרגום", value: w.ar ?? "" });
      }
      if (!w.translit?.trim()) {
        issues.push({ line: n, field: "words.translit", problem: "אין תעתיק", value: w.ar ?? "" });
      }
      // The note is explicit: no English
      if (LATIN_WORD.test(w.he)) {
        issues.push({ line: n, field: "words.he", problem: "אנגלית בתרגום", value: w.he });
      }
    }
  });

  return issues;
}

export function isSongClean(lines: LyricLine[]): boolean {
  return checkSong(lines).length === 0;
}
