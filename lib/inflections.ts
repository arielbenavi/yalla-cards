/**
 * Verb-inflection recognition (note 5e4b20e5, "נטיות לא טוב").
 *
 * The screen used to print the pronoun and ask which verb the form meant. That
 * tests vocabulary: the person was given away in the prompt, so the inflection —
 * the thing the drill exists to teach — could be ignored completely. Recognition
 * now shows the form with its meaning and asks **which person**.
 *
 * The logic lives here rather than in the page so the correctness rule below can
 * be tested. It is the same class of rule as the possessive minimal pair: a
 * question that admits two right answers while accepting one is worse than no
 * question at all.
 */

export const PRONOUN_KEYS = [
  "ana",
  "inta",
  "inti",
  "huwwe",
  "hiyye",
  "ihna",
  "intu",
  "hum",
] as const;

export type Verb = {
  forms: Record<string, string>;
  forms_translit?: Record<string, string>;
};

/** The learner reads transliteration; Arabic is the fallback for seed verbs. */
export function formOf(v: Verb, person: string): string {
  return v.forms_translit?.[person] || v.forms[person] || "";
}

/**
 * Every person whose form is spelled exactly like the target's.
 *
 * Palestinian has real syncretism — the present tense of inta and hiyye is the
 * same word — so this is never guaranteed to be a single person, and the caller
 * must treat all of them as correct.
 */
export function personsMatching(v: Verb, pronoun: string): Set<string> {
  const target = formOf(v, pronoun);
  if (!target) return new Set();
  return new Set(PRONOUN_KEYS.filter((p) => formOf(v, p) === target));
}

/**
 * Options for one recognition question: the target person plus up to three
 * others from the same verb, excluding any that share the target's spelling.
 *
 * Distractors come from the same verb on purpose. Persons of a different verb
 * would be distinguishable by the stem alone, which is the vocabulary shortcut
 * this drill is meant to close off.
 */
export function buildPersonChoices(
  v: Verb,
  pronoun: string,
  shuffle: <T>(a: T[]) => T[] = (a) => a
): string[] {
  const same = personsMatching(v, pronoun);
  const distractors = PRONOUN_KEYS.filter((p) => !same.has(p) && formOf(v, p));
  return shuffle([pronoun, ...shuffle(distractors).slice(0, 3)]);
}
