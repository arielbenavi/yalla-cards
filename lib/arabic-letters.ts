/**
 * Arabic script module (note 23486a6b).
 * Design follows docs/research-2026-07-31-four-features.md.
 *
 * Two things the research insists on and this implements:
 *
 * 1. Letter order is computed from the learner's OWN inventory, not from a
 *    Modern Standard Arabic frequency table. What matters is how many words he
 *    already knows by ear become readable once he learns a letter.
 * 2. Distractors come from his measured confusion matrix, not at random. The
 *    Arabic script is visually dense — 28 letters over far fewer skeletons —
 *    so a random distractor mostly tests nothing.
 */

export type LetterId = string;

export type Letter = {
  ch: LetterId;
  /** Palestinian sound, written the way the rest of the app writes it */
  sound: string;
  name: string;
  /** Letters that do not connect to the following letter */
  nonConnecting?: boolean;
  /** Same skeleton, distinguished mainly by dots */
  family?: string;
};

export const LETTERS: Letter[] = [
  { ch: "ا", sound: "אַ / אָ", name: "אליף", nonConnecting: true },
  { ch: "ب", sound: "בּ", name: "בא", family: "b" },
  { ch: "ت", sound: "ת", name: "תא", family: "b" },
  { ch: "ث", sound: "ת׳ (כמו ת)", name: "ת׳א", family: "b" },
  { ch: "ج", sound: "ג׳", name: "ג׳ים", family: "j" },
  { ch: "ح", sound: "ח", name: "חא", family: "j" },
  { ch: "خ", sound: "ח׳", name: "ח׳א", family: "j" },
  { ch: "د", sound: "ד", name: "דאל", nonConnecting: true, family: "d" },
  { ch: "ذ", sound: "ד׳ (כמו ד/ז)", name: "ד׳אל", nonConnecting: true, family: "d" },
  { ch: "ر", sound: "ר", name: "רא", nonConnecting: true, family: "r" },
  { ch: "ز", sound: "ז", name: "זאי", nonConnecting: true, family: "r" },
  { ch: "س", sound: "ס", name: "סין", family: "s" },
  { ch: "ش", sound: "שׁ", name: "שין", family: "s" },
  { ch: "ص", sound: "צ", name: "צאד", family: "sad" },
  { ch: "ض", sound: "צ׳", name: "צ׳אד", family: "sad" },
  { ch: "ط", sound: "ט", name: "טא", family: "ta" },
  { ch: "ظ", sound: "ט׳", name: "ט׳א", family: "ta" },
  { ch: "ع", sound: "ע", name: "עין", family: "ain" },
  { ch: "غ", sound: "ע׳", name: "ע׳ין", family: "ain" },
  { ch: "ف", sound: "פ", name: "פא", family: "f" },
  { ch: "ق", sound: "ק (בעירונית: א)", name: "קאף", family: "f" },
  { ch: "ك", sound: "כּ", name: "כאף" },
  { ch: "ل", sound: "ל", name: "לאם" },
  { ch: "م", sound: "מ", name: "מים" },
  { ch: "ن", sound: "נ", name: "נון", family: "b" },
  { ch: "ه", sound: "ה", name: "הא", family: "h" },
  { ch: "ة", sound: "ה / ת (סיומת נקבה)", name: "תא מרבוטה", nonConnecting: true, family: "h" },
  { ch: "و", sound: "ו / וּ", name: "ואו", nonConnecting: true },
  { ch: "ي", sound: "י / ִי", name: "יא", family: "y" },
  { ch: "ى", sound: "אַ (אליף מקצורה)", name: "אליף מקצורה", nonConnecting: true, family: "y" },
];

export const BY_CHAR = new Map(LETTERS.map((l) => [l.ch, l]));

/** Visually confusable groups, from the research's risk table. */
export const CONFUSION_GROUPS: LetterId[][] = [
  ["ب", "ت", "ث", "ن"],
  ["ج", "ح", "خ"],
  ["د", "ذ"],
  ["ر", "ز"],
  ["س", "ش"],
  ["ص", "ض"],
  ["ط", "ظ"],
  ["ع", "غ"],
  ["ف", "ق"],
  ["ه", "ة"],
  ["ي", "ى"],
];

export type PositionalForm = "isolated" | "initial" | "medial" | "final";

const ZWJ = "‍";

/**
 * The four positional shapes, built with zero-width joiners rather than
 * hardcoding 112 presentation glyphs. The research is explicit that these are
 * one letter under a shape rule, not separate symbols to memorise — and a
 * non-connecting letter genuinely has no initial or medial form.
 */
export function positionalForm(ch: LetterId, form: PositionalForm): string | null {
  const letter = BY_CHAR.get(ch);
  if (!letter) return null;
  if (letter.nonConnecting && (form === "initial" || form === "medial")) return null;

  switch (form) {
    case "isolated":
      return ch;
    case "initial":
      return ch + ZWJ;
    case "medial":
      return ZWJ + ch + ZWJ;
    case "final":
      return ZWJ + ch;
  }
}

export function availableForms(ch: LetterId): PositionalForm[] {
  const letter = BY_CHAR.get(ch);
  if (!letter) return [];
  return letter.nonConnecting ? ["isolated", "final"] : ["isolated", "initial", "medial", "final"];
}

// ---------------------------------------------------------------------------
// Coverage-first ordering
// ---------------------------------------------------------------------------

export type LetterStat = {
  ch: LetterId;
  /** occurrences across the learner's Arabic-script cards */
  occurrences: number;
  /** how many of his known words contain it */
  words: number;
};

export function letterStats(arabicWords: string[]): LetterStat[] {
  const occ = new Map<string, number>();
  const inWords = new Map<string, Set<number>>();

  arabicWords.forEach((w, i) => {
    for (const ch of w) {
      if (!BY_CHAR.has(ch)) continue;
      occ.set(ch, (occ.get(ch) ?? 0) + 1);
      if (!inWords.has(ch)) inWords.set(ch, new Set());
      inWords.get(ch)!.add(i);
    }
  });

  return LETTERS.map((l) => ({
    ch: l.ch,
    occurrences: occ.get(l.ch) ?? 0,
    words: inWords.get(l.ch)?.size ?? 0,
  }));
}

export type LetterMastery = {
  ch: LetterId;
  trials: number;
  correct: number;
  /** worst single confusion rate against another letter */
  worstConfusion: number;
  sessions: number;
  formsSeen: number;
};

/** The research's mastery bar for one letter. */
export function isMastered(m: LetterMastery): boolean {
  if (m.trials < 20 || m.sessions < 2 || m.formsSeen < 3) return false;
  return m.correct / m.trials >= 0.85 && m.worstConfusion <= 0.2;
}

/**
 * Which letter to teach next.
 *
 * Coverage dominates — the point is to make words he already knows by ear
 * readable. The last term is the research's `unresolved_confusion_load`: do not
 * introduce a third family member while the first two are still confusable.
 */
export function nextLetterScore(
  stat: LetterStat,
  totalWords: number,
  masteryByChar: Map<LetterId, LetterMastery>
): number {
  const coverage = totalWords > 0 ? stat.words / totalWords : 0;
  const frequency = Math.min(1, stat.occurrences / 200);

  const letter = BY_CHAR.get(stat.ch)!;
  // Non-connecting letters explain why a word changes shape, so they earn their
  // place early even when they are not the most frequent.
  const connectivityValue = letter.nonConnecting ? 1 : 0.3;

  const family = letter.family;
  let confusionLoad = 0;
  if (family) {
    const siblings = LETTERS.filter((l) => l.family === family && l.ch !== stat.ch);
    const shaky = siblings.filter((s) => {
      const m = masteryByChar.get(s.ch);
      return m && m.trials > 0 && !isMastered(m);
    });
    confusionLoad = siblings.length ? shaky.length / siblings.length : 0;
  }

  return (
    0.45 * coverage + 0.25 * frequency + 0.2 * connectivityValue - 0.1 * confusionLoad
  );
}

export function orderLetters(
  stats: LetterStat[],
  totalWords: number,
  masteryByChar: Map<LetterId, LetterMastery> = new Map()
): LetterStat[] {
  return [...stats].sort(
    (a, b) =>
      nextLetterScore(b, totalWords, masteryByChar) - nextLetterScore(a, totalWords, masteryByChar)
  );
}

/**
 * Distractors for a multiple-choice trial.
 *
 * Measured confusions first, then same-family letters, then anything already
 * introduced. Count grows with familiarity: 2 while learning, 4 once known.
 */
export function pickDistractors(
  target: LetterId,
  introduced: LetterId[],
  confusions: Map<string, number>,
  count: number
): LetterId[] {
  const pool = introduced.filter((c) => c !== target);

  const measured = pool
    .filter((c) => (confusions.get(`${target}>${c}`) ?? 0) > 0)
    .sort((a, b) => (confusions.get(`${target}>${b}`) ?? 0) - (confusions.get(`${target}>${a}`) ?? 0));

  const family = BY_CHAR.get(target)?.family;
  const siblings = pool.filter((c) => family && BY_CHAR.get(c)?.family === family);

  const group = CONFUSION_GROUPS.find((g) => g.includes(target)) ?? [];
  const grouped = pool.filter((c) => group.includes(c));

  const out: LetterId[] = [];
  for (const c of [...measured, ...siblings, ...grouped, ...pool]) {
    if (out.length >= count) break;
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

export const DISTRACTOR_COUNT = { learning: 2, familiar: 4 } as const;
