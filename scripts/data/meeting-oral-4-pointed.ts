// The pointing for מפגש בעפ 4, keyed by Ariel's own spelling in
// meeting-oral-4.ts.
//
// **This file is empty on purpose.** The pointing has to come from chatifai, and
// on 2026-08-11 the Claude in Chrome extension was not connected, so the pass
// could not run. Nothing here is filled in from general Arabic knowledge — that
// is the one thing this project does not do, and it has produced fabricated
// forms before (`לַוְזִין`, `מַיַّאתִי`, `עַ-בַּלַאש` glossed wrong).
//
// The insert script refuses any entry missing from this map, so an empty file
// means nothing is written rather than something is written badly.
//
// When the extension is connected, the chatifai pass asks for nikud and Arabic
// script ONLY — never a translation, never a verdict — under the rule in
// .claude/agents/chatifai.md. Paste its output here verbatim: same characters,
// no cleanup. `normalizeMarks` in the insert script handles the one permitted
// adjustment, Arabic shadda U+0651 → Hebrew dagesh U+05BC.

export type Pointed = {
  /** Hebrew transliteration with nikud, exactly as chatifai printed it. */
  translit: string;
  /** Arabic script, exactly as chatifai printed it. */
  ar: string;
  /** Anything chatifai volunteered that was not asked for. Does not change the card. */
  chatifaiNote?: string;
};

/** keyed by the `heard` string in meeting-oral-4.ts */
export const POINTED: Record<string, Pointed> = {};

/**
 * Entries Ariel left without a gloss. Held out entirely — a card with no meaning
 * is not a card, and inventing one would be inventing the lesson.
 */
export const NEEDS_GLOSS_FROM_ARIEL = ["צחית", "אווצל / אג'י"];

/**
 * Already in the database under a different gloss. These do not become new
 * cards; what the lesson added is a note on the card that is already there.
 *
 * `פלוס` is the interesting one: the existing card says "כסף", and Tomer's point
 * was specifically that פלוס is *more* than מסארי — a distinction the current
 * card erases. That belongs in `course_note`, not in a duplicate card.
 */
export const EXISTING_CARDS_TO_ANNOTATE: { heard: string; courseNote: string }[] = [
  { heard: "ען", courseNote: "מפגש בעפ 4: אודות" },
  { heard: "פלוס", courseNote: "מפגש בעפ 4: הון — יותר כסף מ-מַצַארִי" },
];
