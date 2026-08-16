// מפגש בעפ 4 — Ariel's notes from the lesson, transcribed verbatim.
//
// Same contract as meeting-oral-3.ts: `heard` is his own spelling, written by
// ear and unpointed, and `he` is his gloss. Neither is edited, completed or
// reordered — they are the evidence of what was said in the room.
//
// Under the rule added 2026-08-11, chatifai's only job on this file is to supply
// the pointing and the Arabic script. It is not asked whether these are the
// right words and it is not asked what they mean; if it answers about a
// different word it gets sent back. Everything here goes in with
// `course_verified = true`.
//
// Entries where Ariel left the gloss blank carry `needsGloss: true`. They are
// held out of the insert — a card with no meaning is not a card — and listed
// back to him rather than guessed at.

export type Heard = {
  /** Ariel's spelling, by ear, unpointed. Never edited. */
  heard: string;
  /** Ariel's gloss, exactly as written. Empty when he left it blank. */
  he: string;
  /** He wrote the line but not its meaning — needs one word from him. */
  needsGloss?: boolean;
  note?: string;
};

/** Time, and going out. */
export const TIME_AND_OUTINGS: Heard[] = [
  { heard: "בעד שוואי / בעדין", he: "עוד מעט" },
  { heard: "ברוח עלא חפלה", he: "הולך להופעה" },
  { heard: "חפלת צאחבי", he: "הופעה של חבר" },
  { heard: "צחית", he: "", needsGloss: true },
  { heard: "עשן", he: "בגלל" },
  { heard: "אחתיאט", he: "מילואים" },
  { heard: "איחכולי", he: "תגידו לי" },
  { heard: "ען", he: "אודות" },
  { heard: "מכאן", he: "מקום" },
];

/** Swimming, and places. */
export const PLACES: Heard[] = [
  { heard: "בריכה", he: "בירכה" },
  { heard: "סבח, יסבח", he: "(הוא) שחה, שחייה", note: "יסבח = שם הפועל" },
  { heard: "בחיב אסבח", he: "אוהב לשחות" },
  { heard: "טברייה", he: "טבריה" },
  { heard: "מונתזה", he: "טיילת" },
  { heard: "רציף", he: "מדרכה" },
];

/** Conditionals, questions, connectives. */
export const FUNCTION_WORDS: Heard[] = [
  { heard: "אזא", he: "אם" },
  { heard: "לו", he: "אם, אילו" },
  { heard: "ווא", he: "ו" },
  { heard: "ליש", he: "למה" },
  { heard: "ווא ליש", he: "ולמה" },
  { heard: "למה", he: "כש" },
];

/** Games, possibility, doing. */
export const ACTIONS: Heard[] = [
  { heard: "בחד'ר", he: "אני צופה" },
  { heard: "שטרנג'", he: "שחמט" },
  { heard: "מעקול", he: "הגיוני, ייתכן" },
  { heard: "מוסתאחיל", he: "לא אפשרי" },
  { heard: "מש מעקול", he: "לא אפשרי" },
  { heard: "בַּלְעַבּ", he: "לשחק", note: "אריאל כתב את זה מנוקד" },
  { heard: "אסוי", he: "לעשות, לסדר, להכין" },
];

/** Weddings. */
export const WEDDINGS: Heard[] = [
  { heard: "ארוס", he: "כלה" },
  { heard: "עריס", he: "חתן" },
  { heard: "עורס", he: "חתונה" },
  { heard: "אווצל / אג'י", he: "", needsGloss: true },
  {
    heard: "מוסתחין אווצל/אג'י עלא ערס",
    he: "לא אפשרי לי להגיע לחתונה היום",
  },
];

/** Money, and the two proverbs. */
export const MONEY_AND_PROVERBS: Heard[] = [
  { heard: "מליש מסארי", he: "אין לי כסף" },
  { heard: "פלוס", he: "הון (כסף)", note: "יותר ממסארי" },
  {
    heard: "אלי מעו פלוסו בנת אלסולטאן ערוסו",
    he: "מי שההון שלו, בת הסולטן תתחתן איתו",
  },
  {
    heard: "אלי ביסתחי מן בנת עמו, מא ביג'יב אוולאד",
    he: "מי שמתבייש מבת דודתו, לא יביא ילדים",
  },
  { heard: "ביסתחי", he: "מתבייש" },
];

export const ALL_ORAL_4: Heard[] = [
  ...TIME_AND_OUTINGS,
  ...PLACES,
  ...FUNCTION_WORDS,
  ...ACTIONS,
  ...WEDDINGS,
  ...MONEY_AND_PROVERBS,
];
