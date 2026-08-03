/**
 * Possessive-suffix drill (note 04cff308).
 * Design from docs/handoff-inflections-rebuild.md.
 *
 * The governing rule is VanPatten's Lexical Preference Principle: learners
 * process words for meaning before they process grammatical markers, so if a
 * sentence carries ANY other cue to the answer, the learner uses that cue and
 * never processes the morpheme. The user wrote this into his own note before
 * knowing the term — "בלי רמז מגדר אחר במשפט!" — and it is enforced here by a
 * validator, not by care.
 */

export type Feature =
  | "my"
  | "your_m"
  | "your_f"
  | "his"
  | "her"
  | "our"
  | "your_pl"
  | "their";

export const FEATURE_LABEL: Record<Feature, string> = {
  my: "שלי",
  your_m: "שלך (ז)",
  your_f: "שלך (נ)",
  his: "שלו",
  her: "שלה",
  our: "שלנו",
  your_pl: "שלכם",
  their: "שלהם",
};

/**
 * Contrast pairs in fixed order, hardest-confusable first. One contrast at a
 * time — the spec is explicit that the full eight-person paradigm must not be
 * shown or drilled at once.
 */
export const CONTRAST_ORDER: [Feature, Feature][] = [
  ["his", "her"],
  ["your_m", "your_f"],
  ["my", "our"],
  ["your_pl", "their"],
];

export type PossessiveForm = {
  base_translit: string;
  base_he: string;
  feature: Feature;
  form_translit: string;
  form_arabic: string;
  form_he: string;
  pattern_class: string;
};

/**
 * Words that would leak the answer if they appeared in a stage-1 sentence.
 * A sentence built around a possessive contrast must not also contain a
 * pronoun, a name, or anything else that resolves the person for free.
 */
const LEAKING_TOKENS = [
  // independent pronouns
  "אַנַא", "אנא", "אִנְתֵ", "אנת", "אִנְתִי", "אנתי", "הֻוֵّ", "הו", "הִיֵّ", "הי",
  "אִחְנַא", "אחנא", "אִנְתוּ", "אנתו", "הֻםֵّ", "הם",
  // possessive particle — carries the same information as the suffix
  "תַבַּע", "תבע", "אִלִי", "אילי",
];

export type LeakCheck = { ok: boolean; reason?: string };

/**
 * Stage-1 validity check. Two option sentences must differ in EXACTLY the
 * possessive form and nothing else, and neither may contain a token that
 * resolves the person independently.
 *
 * This is asserted in a test rather than trusted, because a single leaked cue
 * silently converts the exercise into a reading comprehension task that the
 * learner passes without ever processing the suffix.
 */
export function checkMinimalPair(
  sentenceA: string,
  sentenceB: string,
  formA: string,
  formB: string
): LeakCheck {
  if (formA === formB) {
    return { ok: false, reason: "שתי האפשרויות זהות" };
  }

  const wordsA = sentenceA.trim().split(/\s+/);
  const wordsB = sentenceB.trim().split(/\s+/);

  if (wordsA.length !== wordsB.length) {
    return { ok: false, reason: "המשפטים באורך שונה — ההבדל אינו רק במורפמה" };
  }

  const differing = wordsA.filter((w, i) => w !== wordsB[i]);
  if (differing.length !== 1) {
    return {
      ok: false,
      reason: `${differing.length} מילים נבדלות; מותרת בדיוק אחת`,
    };
  }

  // ...and the one differing word must be the inflected form itself
  const idx = wordsA.findIndex((w, i) => w !== wordsB[i]);
  if (wordsA[idx] !== formA || wordsB[idx] !== formB) {
    return { ok: false, reason: "המילה הנבדלת אינה הצורה הנוטה" };
  }

  for (const token of LEAKING_TOKENS) {
    if (sentenceA.includes(token) || sentenceB.includes(token)) {
      return { ok: false, reason: `רמז חופשי במשפט: ${token}` };
    }
  }

  return { ok: true };
}

/** Build the two option sentences for a contrast. */
export function buildPair(
  a: PossessiveForm,
  b: PossessiveForm,
  predicate: { translit: string; he: string }
): { a: string; b: string; heA: string; heB: string } | null {
  if (a.base_translit !== b.base_translit) return null;
  return {
    a: `${a.form_translit} ${predicate.translit}`,
    b: `${b.form_translit} ${predicate.translit}`,
    heA: `${a.form_he} ${predicate.he}`,
    heB: `${b.form_he} ${predicate.he}`,
  };
}

export type ContrastMastery = { trials: number; correct: number };

/**
 * Mastery per contrast, keyed the way CONTRAST_ORDER writes it.
 *
 * Attempts are stored with whichever feature happened to be the target, so
 * his>her and her>his are the same contrast and must be counted together. The
 * sort-then-rekey is what makes that true; getting it wrong halves every count
 * and keeps the learner on contrast one forever.
 */
export function buildMastery(
  attempts: { target_feature: string; contrast_with: string | null; correct: boolean }[]
): Map<string, ContrastMastery> {
  const bySorted = new Map<string, ContrastMastery>();
  for (const a of attempts) {
    if (!a.contrast_with) continue;
    const k = [a.target_feature, a.contrast_with].sort().join(">");
    const m = bySorted.get(k) ?? { trials: 0, correct: 0 };
    m.trials++;
    if (a.correct) m.correct++;
    bySorted.set(k, m);
  }

  const ordered = new Map<string, ContrastMastery>();
  for (const pair of CONTRAST_ORDER) {
    const m = bySorted.get([...pair].sort().join(">"));
    if (m) ordered.set(pair.join(">"), m);
  }
  return ordered;
}

/** Eight trials at 85% — the bar for calling a contrast learned. */
export function isContrastSolid(m: ContrastMastery | undefined): boolean {
  return !!m && m.trials >= 8 && m.correct / m.trials >= 0.85;
}

/**
 * Which contrast to drill. Work down CONTRAST_ORDER and stay on the first one
 * that is not yet solid — non-paradigmatic progression, one contrast at a time.
 */
export function nextContrast(
  mastery: Map<string, ContrastMastery>
): [Feature, Feature] {
  for (const pair of CONTRAST_ORDER) {
    if (!isContrastSolid(mastery.get(pair.join(">")))) return pair;
  }
  // Everything solid — cycle for maintenance
  return CONTRAST_ORDER[Math.floor(Math.random() * CONTRAST_ORDER.length)];
}

/**
 * Contrasts that stage 3 may draw on.
 *
 * The spec gates production on the identification row reaching FSRS state
 * Review. This drill deliberately writes no FSRS state at all — it is a practice
 * layer — so the same gate is expressed with the mastery signal the drill does
 * record. The ordering principle is what matters and it is preserved: you cannot
 * be asked to produce a contrast you cannot yet recognise.
 */
export function solidContrasts(mastery: Map<string, ContrastMastery>): [Feature, Feature][] {
  return CONTRAST_ORDER.filter((pair) => isContrastSolid(mastery.get(pair.join(">"))));
}

/**
 * Grading form for typed production. Nikud is stripped: a learner who types the
 * right consonants has produced the right word, and failing him over a missing
 * dot would punish the keyboard rather than the grammar. The fully-pointed form
 * is still what gets shown on reveal.
 */
export function normaliseTyped(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ًٌٍَُِّْٰ]/g, "")
    .replace(/[.,?!״"'’\-־]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function gradeProduction(typed: string, expected: string): boolean {
  return !!normaliseTyped(typed) && normaliseTyped(typed) === normaliseTyped(expected);
}
