// מפגש בעפ 3 — Ariel's notes from the lesson, transcribed verbatim.
//
// These are forms he heard Tomer say out loud. Under the rule in
// .claude/skills/tasks/SKILL.md they are the *proposal*, not a question: chatifai
// is asked to confirm the lesson form, and only a drastic difference (different
// word, different root, wrong meaning) overrides it. Everything here goes in with
// `course_verified = true` whether or not chatifai ends up agreeing.
//
// `heard` is Ariel's own Hebrew spelling, written by ear and without nikud —
// preserved exactly, because it is the evidence. `he` is his gloss, also exact.
// Nothing in this file has been corrected, completed, or reordered.
//
// `tomer: true` marks the entries where he wrote (מאומת תומר) explicitly. The
// rest are from the same lesson and carry the same authority; the flag just
// records where he said so in writing.

export type Heard = {
  /** Ariel's spelling, by ear, unpointed. Never edited. */
  heard: string;
  /** Ariel's gloss, exactly as written. */
  he: string;
  /** He wrote (מאומת תומר) beside this one. */
  tomer?: boolean;
  /** His own note attached to the line. */
  note?: string;
};

/** Answers to שו אחבאראכ, and general vocabulary. */
export const GENERAL: Heard[] = [
  { heard: "אעדי", he: "רגיל", note: "תשובה לשאלה שו אחבאראכ" },
  { heard: "חייז'ין", he: "חיים", note: "תשובה לשאלה שו אחבאראכ" },
  { heard: "מועיין", he: "מסוים" },
  { heard: "אואל אישי", he: "דבר ראשון" },
  { heard: "אילי בידנא נעמלו", he: "מה שאנחנו רוצים לעשות אותו" },
  { heard: "כול וואחאד", he: "כל אחד" },
  { heard: "לזם יוכתוב", he: "צריך לכתוב" },
  { heard: "לזם נערף", he: "צריכים לדעת" },
  { heard: "ג'ומלה", he: "משפט" },
  { heard: "ג'מלתין", he: "שני משפטים" },
  { heard: "נעמל", he: "נעשה" },
  { heard: "נעמלו", he: "נעשה אותו" },
  { heard: "אלי", he: "מי ש / מה ש", note: "עם שדה, בתחילת משפט" },
  { heard: "כזב", he: "שקר" },
  { heard: "מבלעש", he: "נתחיל" },
  { heard: "חודו", he: "קחו" },
  { heard: "אַנַא גַ'אהֵז", he: "אני מוכן (זכר)" },
  { heard: "אַנַא גַ'אהְזֵה", he: "אני מוכנה (נקבה)" },
  { heard: "כוליל באקיה", he: "כל השאר" },
  { heard: "תרג'ם", he: "תרגם", tomer: true },
  { heard: "עיסה / עסה", he: "עכשיו" },
  { heard: "קציר", he: "קצר", note: "אריאל: לתקן בכרטיסייה" },
  {
    heard: "אציר",
    he: "אהיה",
    note: "אריאל: לא משתמשים כל כך, עדיף לומר אכון",
  },
  { heard: "אכון", he: "אהיה", note: "העדיף על אציר" },
  { heard: "אעטל", he: "מובטל", tomer: true, note: "אריאל: אפשר להגיד גם מובטל" },
  { heard: "הונאכ", he: "שם" },
  { heard: "ע'אד", he: "שם", note: "אריאל: יותר פלסטיני מ-הונאכ" },
  { heard: "מחל", he: "במקום", note: "אריאל: לא רק מקום" },
  { heard: "מוסתוא", he: "רמה" },
  { heard: "מוסתוא אעלי", he: "רמה גבוהה" },
  { heard: "אנא אומפאקר / אנא בפאכר", he: "אני חושב" },
  { heard: "חכינה", he: "(אנחנו) דיברנו" },
  { heard: "אשתריית", he: "קניתי" },
  { heard: "סכראן", he: "שיכור" },
  { heard: "פכרני סכראן", he: "הוא חשב אותי שיכור" },
  { heard: "צאפארת", he: "נהגתי" },
  { heard: "פכס אלכוחול", he: "בדיקת אלכוהול" },
  { heard: "בחליףכום", he: "מבטיח לכם" },
  { heard: "עשרים ולד", he: "עשרים ילד", note: "אריאל: 11 ומעלה חוזר ליחיד" },
  { heard: "עישרין תאניה", he: "20 שניה" },
];

/** Animals, plants, food. */
export const THINGS: Heard[] = [
  { heard: "ביסה", he: "חתול", tomer: true, note: "עם שדה. אריאל: אפשר לומר גם כותה" },
  { heard: "כותה", he: "חתול", tomer: true },
  { heard: "ג'נינה", he: "גינה", tomer: true },
  { heard: "חַיַוַאנַאת אַלִיפֵה", he: "חיות מחמד", note: "מילולית: חיות מאולפות/ידידותיות" },
  { heard: "חייואן", he: "חיה" },
  { heard: "פיג'ל", he: "צנון" },
  { heard: "חציל", he: "חציל", note: "אריאל כתב: בינתינג'אן" },
  { heard: "בינתינג'אן", he: "חציל" },
  { heard: "חס", he: "חסה (ירק)", note: "אריאל כתב 'חסה = חס (עם שדה (ירק)'" },
  { heard: "סבאנח'", he: "תרד" },
  { heard: "גרסון", he: "מלצר" },
];

/** Justice / blame idioms. */
export const RIGHT_WRONG: Heard[] = [
  { heard: "מעכ חכ / אלחכ מעק", he: "הצדק איתך" },
  { heard: "אלחק עליכ", he: "אתה אשם", note: "כאילו האמת גילתה אותך" },
];

/** Turns, meeting people, places lived. */
export const PEOPLE: Heard[] = [
  { heard: "דור מין", he: "תור מי?" },
  { heard: "תערפת עלא", he: "הכרתי על (הכרתי את)" },
  { heard: "כונת סאכן", he: "הייתי גר" },
  { heard: "ג'מעת אלחיר", he: "חבורת הטוב" },
  { heard: "מודרב סייאקה", he: "מורה נהיגה" },
  { heard: "סייאכ / שופיר", he: "נהג" },
  { heard: "ענדי אחין", he: "יש לי שני אחים" },
  { heard: "אחין", he: "שני אחים" },
];

/** Wedding, and the feminine past-tense pattern. */
export const WEDDING: Heard[] = [
  { heard: "ג'וזאת", he: "התחתנתי" },
  { heard: "כאנאת לאזם", he: "הייתה צריכה", note: "אריאל: לאזם אומרים על כל הגופים" },
  { heard: "דחלת", he: "נכנסה" },
  { heard: "אוחתי טאלבת מינהה", he: "אחותי ביקשה ממנה" },
  { heard: "אוע'ניה", he: "שיר" },
  { heard: "קאעה", he: "אולם (חתונה)" },
  { heard: "טאלבאת", he: "היא ביקשה" },
  { heard: "וואפאקאת", he: "הסכימה (היא)" },
];

/**
 * Greetings — the richest part of the lesson, and the part most likely to be
 * where a chatbot's preference is worth least: these are things people say to
 * each other, and Tomer gave both halves of each exchange.
 */
export const GREETINGS: Heard[] = [
  { heard: "מג'מלאת", he: "ברכות" },
  { heard: "אעש מין שאפכ", he: "אומרים לאדם שלא ראינו תקופה ממושכת" },
  { heard: "עישת ודומת", he: "חייתי ונשארתי", note: "תשובה ל-אעש מין שאפכ" },
  {
    heard: "נווארת אלמחל",
    he: "הארת את המקום",
    note: "ברכה לאדם חשוב שלא ראינו כמה זמן. אפשר גם רק נווארת = הארת",
  },
  { heard: "נווארת", he: "הארת" },
  { heard: "בוג'ודכ", he: "בנוכחותך", note: "תשובה ל-נווארת אלמחל" },
  { heard: "בוג'ודהום", he: "בנוכחותכם", note: "תשובה ל-נווארת אלמחל" },
  { heard: "צחה", he: "לבריאות", note: "תגובה לאדם שמתעטש, וגם לאדם שמסב לאכול" },
  {
    heard: "תעיש",
    he: "תחיה",
    note:
      "לאדם שמסב לאכול. אריאל: בימי קדם מי שהתעטש סימן שהיה חולה וסימן שהולך " +
      "למות, לכן אומרים תחיה (שלא תמות)",
  },
  { heard: "עלא קלבכ", he: "על הלב שלך", note: "תגובה ל-צחה — לבריאות על הלב שלך" },
  {
    heard: "יסלמו אידיכ / יסלמו",
    he: "ברכה למי שמביא משהו תוצרת יד",
    note: "לנקבה: יסלמו אידיכי",
  },
  { heard: "ואידיכ", he: "וידיך", note: "תגובה ל-יסלמו אידיכ" },
  {
    heard: "יעטיכ אלעפי / אלעפיה",
    he: "יתן לך בריאות (אלוהים ייתן לך בריאות)",
    note: "אריאל: הברכה הכי משומשת, מתאימה לכל סיטואציה, במיוחד לעבודה קשה",
  },
  { heard: "אללה יעפיכ", he: "אלוהים יבריא אותך", note: "תשובה ל-יעטיכ אלעפיה" },
];

/**
 * קציר / אציר — resolved by Ariel on 2026-08-06.
 *
 * The word for "short" is قصير: written `קציר` under the ק convention and
 * pronounced `אציר` in urban speech, which is why the existing card
 * `אַצִיר` = "קצר" is right rather than mislabelled.
 *
 * The lesson's `אציר` = "אהיה" is a **different word** — أصير — that happens to
 * sound the same. Both cards exist and each carries a note pointing at the other,
 * because a learner who meets one without the other will merge them.
 *
 * Tomer's note that אַכּוּן is preferred over אַצִיר for "אהיה" rides along with
 * the أصير card.
 */
/** Goes on the قصير card — points at the other word. */
export const HOMOPHONE_NOTE_QASIR =
  "נכתבת קציר (قصير) ונהגית אַצִיר. יש מילה נוספת בהגייה זהה: أصير = אהיה.";
/** Goes on the أصير card — points back. */
export const HOMOPHONE_NOTE_ASIR =
  "יש מילה נוספת בהגייה זהה: قصير = קצר. אריאל מתומר: עדיף אַכּוּן על אַצִיר ל'אהיה'.";

/**
 * Lines Ariel left incomplete. He said to decide rather than wait, so each has a
 * call recorded here — but "decide" cannot mean invent Arabic, so the calls are
 * about *whether to keep the line*, never about what the word is.
 */
export const RESOLVED_GAPS = [
  {
    line: "אמת = (ריק)",
    decision: "מדלגים",
    why:
      "הוא כתב 'כזב = שקר' ואז 'אמת =' בלי ערך. המילה הערבית לאמת לא נאמרה " +
      "בהערות, ולהמציא אותה זה בדיוק מה שאסור. כזב נכנס; אמת תיכנס כשהמילה תגיע.",
  },
  {
    line: "שו סח",
    decision: "מדלגים",
    why: "נרשם בלי תרגום. בלי לדעת מה נאמר בשיעור אין מה לאשר מול chatifai.",
  },
  {
    line: "דור מין עיסא = ?",
    decision: "מדלגים",
    why:
      "אריאל עצמו שם סימן שאלה. 'דור מין' (תור מי?) כן נכנס — הוא רשם לו תרגום " +
      "מלא, ורק ההמשך נשאר פתוח.",
  },
  {
    line: "מֻקַאבַּלֵה = אישה או רעיון",
    decision: "שומרים את הכרטיס הקיים, לא משנים אותו",
    why:
      "מֻאַאבַּלֵה כבר קיים אצלנו כ'פגישה / ראיון', מאומת chatifai. " +
      "'אישה או רעיון' לא מתיישב עם זה בשום קריאה, וסביר שנפלה שורה בהעתקה. " +
      "לשנות פירוש קיים על סמך שורה שלא מתפענחת יזיק יותר משיועיל.",
  },
  {
    line: "נוסחה לפעלים בעבר בגוף נקבה: 'שחמט (מבחינת הניקוד)'",
    decision: "הדוגמאות נכנסות, הכלל לא",
    why:
      "דַחַלַת, טַאלַבַּאת ווַאפַאקַאת נכנסות ככרטיסים ומלמדות את התבנית בפועל. " +
      "מה ש'שחמט' מציין — משקל, ראשי תיבות, או שם של תבנית — לא ברור לי, " +
      "ולנסח כלל דקדוקי שלא הבנתי גרוע מלא לנסח אותו בכלל.",
  },
];

export const ALL_GROUPS: [string, Heard[]][] = [
  ["כללי", GENERAL],
  ["חיות, ירקות ואוכל", THINGS],
  ["צדק ואשמה", RIGHT_WRONG],
  ["אנשים ומקומות", PEOPLE],
  ["חתונה ועבר בנקבה", WEDDING],
  ["ברכות", GREETINGS],
];
