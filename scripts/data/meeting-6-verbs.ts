// המשך תרגול הטיות — the six verbs from the second מפגש 6 practice table.
//
// The table itself is BLANK on the page: Ariel left the lesson partway through
// and never filled the cells in. So there is nothing to transcribe from it —
// only the six verb headings, which are typed and clearly pointed, and the row
// labels, which are the standard eight persons plus אִסֵם (א)לְפַאעֵל.
//
// What that means for this file: the stems and the glosses are the lesson's, and
// the conjugations are not here at all. They have to come from chatifai — a full
// past / present / imperative / participle paradigm per verb, in the shape
// `verb_conjugations.forms_full` expects. Nothing is written until they arrive.
//
// The handwriting in the margins of that photograph is Ariel practising two
// verbs that are already in the database and already chatifai-verified —
// שַאף (ראה) and שִרֵבּ (שתה). No new verb hides in it. Worth saying out loud,
// because "add the handwritten ones too" reads like there is a seventh.
//
// The pattern column is the lesson's own point (p. 35): פַעַל takes a fatha in
// the stem, פִעֵל a hiriq-tsere. It is recorded so the drill can group by it.

export type NewVerb = {
  /** As printed in the table header, pointed. */
  translit: string;
  /** The book's Hebrew gloss, exactly as printed. */
  he: string;
  /** משקל, per the מפגש 6 past-tense lesson. */
  pattern: "פַעַל" | "פִעֵל";
};

/**
 * Arabic script is deliberately absent. The book page gives none, and writing it
 * from general knowledge is the move that produced fabricated forms before.
 * chatifai supplies it in the same pass as the conjugation.
 */
export const MEETING_6_VERBS: NewVerb[] = [
  { translit: "רַפַע", he: "הרים", pattern: "פַעַל" },
  { translit: "סְמֵע", he: "שמע", pattern: "פִעֵל" },
  { translit: "צַ'עַ'ט", he: "לחץ", pattern: "פַעַל" },
  { translit: "חְ'לֵק", he: "נולד", pattern: "פִעֵל" },
  { translit: "חַלַק", he: "התגלח", pattern: "פַעַל" },
  { translit: "לַעֵבּ", he: "שיחק", pattern: "פִעֵל" },
];

/**
 * The table's rows. The last one is why this is a מפגש 6 table and not a repeat
 * of the first: it asks for the active participle beside the eight persons,
 * which is the tense-carrying form the lesson spent its second half on.
 */
export const TABLE_ROWS = [
  "אַנַא",
  "אִנְתֵ",
  "אִנְתִי",
  "הֻוֵّ",
  "הִיֵّ",
  "אִחְנַא",
  "אִנְתוּ",
  "הֵםّ",
  "אִסֵם (א)לְפַאעֵל",
];

/** Filled by the chatifai pass, keyed by `translit` above. Empty until then. */
export type Cell = { translit: string; arabic: string };
export type Paradigm = {
  root: string;
  root_translit: string;
  past: Record<string, Cell>;
  present: Record<string, Cell>;
  imperative: Record<string, Cell>;
  participle?: Record<string, Cell>;
};

export const CONJUGATIONS: Record<string, Paradigm> = {};
