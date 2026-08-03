// chatifai's rulings on the vocabulary worklist (note b4fe5996).
//
// `scripts/build-vocab-worklist.ts` finds words that appear inside stored
// phrases and sentences but have no card of their own. Whether such a word
// deserves its own card is an Arabic judgement — a word can be inseparable from
// a frozen expression, or just an inflected form — so every entry here is a
// verdict, sent with the sentence the word came from.
//
// Verbatim. Where its output differed from what was sent, the difference is
// recorded in DIFFS rather than quietly reconciled.
export type Entry = { translit: string; ar: string; he: string; note?: string };

export const NEW_CARDS: Entry[] = [
  { translit: "שֵׁיכֵּל", ar: "شيكل", he: "שקל", note: "chatifai: מילת יסוד יומיומית" },
  {
    translit: "תְפַצַ'ל",
    ar: "تفضل",
    he: "בבקשה / התכבד",
    note:
      "chatifai: האות היא ض ולכן צ' עם גרש. משמשת להכל — " +
      "'כנס', 'שב', 'קח', 'הנה הכסף'",
  },
  { translit: "צַבַּאח", ar: "صباح", he: "בוקר", note: "chatifai: מופיעה בהרבה צירופים" },
  { translit: "וֵין", ar: "وين", he: "איפה", note: "chatifai: מילת שאלה בסיסית ביותר" },
  {
    translit: "שִׁי",
    ar: "شي",
    he: "דבר / משהו",
    note: "chatifai: גם אִשִׁי וגם שִׁי נכונות. כֻּלּ שִׁי = הכל, וַלַא שִׁי = שום דבר",
  },
  { translit: "אִיד", ar: "إيد", he: "יד", note: "chatifai: רבים אַיַאדִי" },
  {
    translit: "מְבַּיֵּן",
    ar: "مبين",
    he: "נראה / בולט",
    note: "chatifai: מתנהגת כמו תואר — מְבַּיֵּן עַלֵיכּ תַעְבַּאן = נראה עליך שאתה עייף",
  },
  { translit: "אִמְתִחַאן", ar: "امتحان", he: "מבחן" },
  { translit: "בֻּכְּרַא", ar: "بكرة", he: "מחר" },

  {
    translit: "נַצִיבּ",
    ar: "نصيب",
    he: "גורל / מזל / חלק",
    note:
      "chatifai: בקִסְמֵה וְנַצִיבּ שתיהן 'גורל', אבל נַצִיבּ היא זו שמשמשת לבד. " +
      "הַאדַא נַצִיבּוֹ = זה הגורל שלו",
  },
  { translit: "עֵילֵה", ar: "عيلة", he: "משפחה", note: "chatifai: רבים עַאאִלַאת" },
  { translit: "מַסְכִּין", ar: "مسكين", he: "מסכן" },
  { translit: "יַתִים", ar: "يتيم", he: "יתום" },
  { translit: "הַם", ar: "هم", he: "דאגה / צער", note: "chatifai: נפוצה בשירים ובביטויי קושי" },
  {
    translit: "מֻאַאבַּלֵה",
    ar: "مقابلة",
    he: "פגישה / ראיון",
    note: "chatifai: המרת ق ל-א' (עירוני)",
  },
  {
    translit: "צַרַאחַה",
    ar: "صراحة",
    he: "כנות / גילוי לב",
    note: "chatifai: האות היא ص ולכן צ בלי גרש. בִּ(אל)צַّרַאחַה = בכנות",
  },
  {
    translit: "זַלַמֵה",
    ar: "زلمة",
    he: "גבר / איש",
    note: "chatifai: ברחוב לא פונים ב-יַא רַגֻ'ל אלא ב-יַא זַלַמֵה",
  },
  {
    translit: "טַיֵּבּ",
    ar: "طيب",
    he: "טוב / בסדר / טעים",
    note: "chatifai: גם אוכל טעים, גם אדם טוב לב, וגם מילת קישור בשיחה",
  },
  {
    translit: "כַּלַאם",
    ar: "كلام",
    he: "דיבורים / מילים",
    note: "chatifai: שם קיבוצי לדיבור, להבדיל מכִּלְמֵה = מילה אחת",
  },
  { translit: "נַאס", ar: "ناس", he: "אנשים", note: "chatifai: שם קיבוצי" },
  { translit: "חְסַאבּ", ar: "حساب", he: "חשבון", note: "chatifai: בנק, מסעדה, או 'לעשות חשבון'" },
];

/** Ruled as not deserving a card, with his reason. */
export const REJECTED = [
  "סַמַחְת — צורה נטויה של סַמַח (הירשה). עדיף ללמוד את הביטוי הקפוא לַוְ סַמַחְת.",
  "יִסְלַמוּ — חלק מברכת יִסְלַמוּ אִידֵיכּ. מילולית 'שיהיו שלמים/בריאים'.",
  "תְשַרַפְנַא — ביטוי קפוא, 'לכבוד לנו'. עדיף כיחידה אחת.",
];

/** Where his output differed from what was sent. Not reconciled here. */
export const DIFFS = [
  "תְפַצַّל → תְפַצַ'ל — החליף את השדה בגרש והסביר שהאות ض",
  "מְבַּיֶّן → מְבַּיֵּן — צירה + דגש במקום סגול + שדה",
  "הַםّ → הַם — בלי שדה",
  "טַיֵבּ → טַיֵّבּ — הוסיף דגש ב-י'",
  "שִי → שִׁי — הוסיף שין ימנית",
];
