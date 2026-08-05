// chatifai's confirmations of the מפגש בעפ 3 lesson forms.
//
// Empty until chatifai is reachable — it was logged out when this batch was
// prepared. The file exists now so the insert path is finished and reviewed
// before the rulings arrive, rather than being written in a hurry around them.
//
// **How to fill this in.** For each entry, `translit` and `ar` are what chatifai
// printed for the form Tomer said. `chatifai_agrees` records whether it accepted
// that form:
//
//   - agrees, or differs only in a vowel / dagesh / tā marbūṭa
//       → keep the lesson form, `chatifai_agrees: true`
//   - differs drastically (different word, different root, meaning does not match)
//       → use chatifai's form, `chatifai_agrees: false`, and say so to Ariel
//   - differs somewhere in between
//       → keep the lesson form, `chatifai_agrees: false`, and put what it said in
//         `chatifai_said` so the disagreement survives
//
// Never silently replace a lesson form. See .claude/skills/tasks/SKILL.md.

export type Ruled = {
  /** Ariel's by-ear spelling, carried through so the card traces back to it. */
  heard: string;
  /** chatifai's pointed transliteration of the lesson form. */
  translit: string;
  ar: string;
  he: string;
  /** True only if chatifai accepted the form said in the lesson. */
  chatifai_agrees?: boolean;
  /** What chatifai said when it did not agree. Verbatim. */
  chatifai_said?: string;
  /** Ariel wrote (מאומת תומר) beside it. */
  tomer?: boolean;
  /** Ariel's own note from the lesson. */
  ariel_note?: string;
  /** Extra usage note worth keeping on the card. */
  note?: string;
  item_type?: "word" | "phrase" | "sentence";
};

export const RULED: Ruled[] = [];
