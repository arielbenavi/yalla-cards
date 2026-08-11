// מפגש 6 — הפועל בעבר, הבינוני, זמנים.
//
// Two sources, and they are NOT interchangeable:
//
// **The book pages** (Ariel photographed pp. 35, 39 and the tables). These are
// already pointed, so the nikud here is the book's, read off the page. Nothing
// in `BOOK_*` was composed.
//
// **Ariel's own notes from the מפגש בעל פה** — what Tomer said out loud. He
// typed these unpointed. They carry `needsNikud: true`, and the pointing comes
// from chatifai under the rule added 2026-08-11: for lesson material chatifai is
// asked **only** for nikud and Arabic script, never for a translation or a
// verdict, and it is sent back until it answers about the word that was asked
// about. The meaning is Tomer's and does not get "corrected".
//
// Cells I could not read off the photograph with confidence carry
// `uncertain: true`. They are held out of the insert rather than guessed —
// a wrong vowel on a paradigm cell propagates into every drill built on it.

export type Vocab = {
  translit: string;
  he: string;
  /** Arabic script, when the book gave it or chatifai supplied it */
  ar?: string;
  plural?: string;
  /** true when Ariel wrote it unpointed and chatifai must supply the pointing */
  needsNikud?: boolean;
  /** true when I could not read the photograph with confidence */
  uncertain?: boolean;
  note?: string;
};

// ---------------------------------------------------------------------------
// From Ariel's notes — מפגש בעל פה 6 (פעלים). מאומת תומר.
// ---------------------------------------------------------------------------

/** Grammar points, in Tomer's framing. These are rules, not cards. */
export const NOTES_RULES = [
  {
    key: "b_prefix_progressive",
    he: "ב + פִעֵל = הווה מתמשך",
    detail: 'תומר: "ב פיעל = הייה ב קיטקט" — תחילית בּ- על צורת ההווה נותנת פעולה שקורית עכשיו',
  },
  {
    key: "huwwe_bare_stem",
    he: "הוּא = תמיד הפועל עצמו",
    detail:
      "צורת הוא בעבר היא הגזע החשוף, בלי סיומת. דַפַע (שילם) היא גם השורש וגם הצורה של הוא",
  },
] as const;

/** Time expressions Tomer gave. All unpointed as Ariel typed them. */
export const NOTES_TIME: Vocab[] = [
  { translit: "אל אסבוע אל ג'אי", he: "השבוע הבא", needsNikud: true },
  { translit: "סנה אל ג'אייה", he: "שנה הבאה", needsNikud: true },
  { translit: "אבל סנה", he: "לפני שנה", needsNikud: true },
  { translit: "אל לילה", he: "היום בלילה", needsNikud: true },
  { translit: "אלח'מיס אלג'אי", he: "יום חמישי הבא", needsNikud: true },
  { translit: "אלארבעה אלי פאת", he: "יום רביעי שעבר", needsNikud: true },
  { translit: "תאני יום", he: "למחרת", needsNikud: true },
];

/** Days of the week as Tomer said them — short forms, without the word יום. */
export const NOTES_DAYS: Vocab[] = [
  { translit: "לאחד", he: "יום ראשון", needsNikud: true },
  { translit: "ח'מיס", he: "יום חמישי", needsNikud: true },
  { translit: "ג'מעה", he: "יום שישי", needsNikud: true },
  { translit: "סבת", he: "יום שבת", needsNikud: true },
  {
    translit: "תנין / תלאתה / ארבעה",
    he: "שני / שלישי / רביעי",
    needsNikud: true,
    note: "תומר: משתמע — נגזרים מהמספרים, לא צריך ללמוד בנפרד",
  },
];

/** Vocabulary from the notes. */
export const NOTES_VOCAB: Vocab[] = [
  { translit: "אכל", he: "אכל", needsNikud: true, note: "מפגש בעל פה 6 — פועל להוסיף" },
  { translit: "שרב", he: "שתה", needsNikud: true, note: "מפגש בעל פה 6 — פועל להוסיף" },
  { translit: "דפע", he: "שילם", needsNikud: true, note: "הדוגמה של תומר לגזע החשוף בצורת הוא" },
  { translit: "חמד", he: "שבח", needsNikud: true },
  {
    translit: "אלחמד ללה",
    he: "השבח לאל",
    needsNikud: true,
    note: "תומר: הביטוי מגיע מהערבית הספרותית",
  },
  { translit: "ג'ריח", he: "פצוע", plural: "ג'רחא", needsNikud: true },
  { translit: "וצל", he: "הגיע", needsNikud: true },
  { translit: "ח'רג'", he: "יצא", needsNikud: true },
  { translit: "כשף", he: "גילה", needsNikud: true },
  { translit: "מכשוף", he: "גלוי", needsNikud: true, note: "בינוני פעול של כשף" },
  { translit: "שרח", he: "הסביר", needsNikud: true },
  { translit: "אח'ד", he: "לקח", needsNikud: true },
  { translit: "צ'רב", he: "פגע, היכה", needsNikud: true },
  { translit: "אואעי", he: "בגדים", needsNikud: true },
  { translit: "חראם", he: "אסור", needsNikud: true },
  { translit: "חלאל", he: "מותר", needsNikud: true },
];

/** Phrases Tomer gave whole. The Hebrew is his, and stays his. */
export const NOTES_PHRASES: Vocab[] = [
  {
    translit: "ב(א)לויל",
    he: "על הפנים",
    needsNikud: true,
    note: "תומר: חַאלְתְנַא ב(א)לויל = מצבנו על הפנים",
  },
  { translit: "חאלתנא ב(א)לויל", he: "מצבנו על הפנים", needsNikud: true },
  {
    translit: "חסאבנא ע(א)למכשוף",
    he: "חשבוננו גלוי",
    needsNikud: true,
    note: "תומר: כלומר על הפנים, במינוס",
  },
  { translit: "בנת חלאל", he: "בחורה אחלה", needsNikud: true },
  { translit: "בנת חראם", he: "בחורה זבל", needsNikud: true },
  { translit: "חראם עליכ", he: "מתנהג בצורה לא יפה", needsNikud: true },
  { translit: "מיש חראם", he: "לא חבל?", needsNikud: true },
  { translit: "אואעי (א)לעיד", he: "בגדי חג", needsNikud: true },
];

/**
 * Verbs Ariel asked to have fully inflected, with the one inflected form he
 * gave. The rest of the paradigm is generated from the book's פַעַל table —
 * generated, not invented: the table is the lesson's own rule, and applying a
 * documented rule to a documented stem is not the same as making up Arabic.
 * Still goes past chatifai for the pointing before it becomes cards.
 */
export const NOTES_INFLECT: { stem: string; he: string; given: { form: string; person: string }[] }[] = [
  { stem: "צ'רב", he: "פגע, היכה", given: [{ form: "צ'רבתו", person: "היא פגעה בו" }] },
  { stem: "שרח", he: "הסביר", given: [{ form: "שרחת", person: "היא הסבירה" }] },
  { stem: "אח'ד", he: "לקח", given: [{ form: "אח'דת", person: "היא לקחה" }] },
];
