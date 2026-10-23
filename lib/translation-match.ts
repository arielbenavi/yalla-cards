// "Close enough" for the free-text translation drill (/translate).
//
// Nobody types nikud on a phone keyboard, and the book's own answers carry
// optional pieces — (א)ל, (אל), alternatives in brackets — so an exact match
// would mark almost every honest answer wrong. What is compared instead is the
// letter skeleton: no nikud, no geresh, no punctuation, final letters folded,
// and for transliteration also no א (the long-a mater the learner may or may
// not write). The score is 1 − edit distance / length.
//
// Word marks are for feedback only: which words of the book's answer appear,
// near enough, in what was typed.

const NIKUD = /[֑-ׇ]/g;
const GERESH = /['׳`’]/g;
const FINAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

export type Lang = "ar" | "he";

function fold(s: string, lang: Lang): string {
  let out = s
    .replace(NIKUD, "")
    .replace(GERESH, "")
    .replace(/[ךםןףץ]/g, (c) => FINAL[c]);
  // (א)ל / (אל) / (ל): keep the letters, drop the brackets — typed or not, same skeleton
  out = out.replace(/[()]/g, "");
  out = out.replace(/[^א-ת\s]/g, " ");
  if (lang === "ar") out = out.replace(/א/g, "");
  return out.replace(/\s+/g, " ").trim();
}

/** For a Hebrew answer, a bracketed part is optional: "(אלוהים) יתן לך" accepts "יתן לך". */
function heVariants(answer: string): string[] {
  const without = answer.replace(/\([^)]*\)/g, " ");
  const withAll = answer.replace(/[()]/g, " ");
  // "מזוודתך/תיקך" — either side of a slash
  const firstAlt = without.replace(/(\S+)\/\S+/g, "$1");
  const secondAlt = without.replace(/\S+\/(\S+)/g, "$1");
  return [...new Set([without, withAll, firstAlt, secondAlt])];
}

function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function similarity(a: string, b: string): number {
  const x = a.replace(/ /g, "");
  const y = b.replace(/ /g, "");
  if (!x && !y) return 1;
  return 1 - distance(x, y) / Math.max(x.length, y.length);
}

export const PASS = { ar: 0.8, he: 0.75 } as const;

export type MatchResult = {
  score: number;
  pass: boolean;
  /** Each word of the book's answer, and whether it showed up in the typed text. */
  words: { word: string; found: boolean }[];
};

export function matchAnswer(typed: string, answer: string, lang: Lang): MatchResult {
  const candidates = lang === "he" ? heVariants(answer) : [answer];
  const t = fold(typed, lang);
  const score = Math.max(...candidates.map((c) => similarity(t, fold(c, lang))));

  const typedWords = t.split(" ").filter(Boolean);
  const words = answer
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const w = fold(word, lang);
      // A word with nothing left after folding (a bare "(א)" or punctuation) needs no match
      const found = !w || typedWords.some((tw) => similarity(tw, w) >= 0.67);
      return { word, found };
    });

  return { score, pass: score >= PASS[lang], words };
}
