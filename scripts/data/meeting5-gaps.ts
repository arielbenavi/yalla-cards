// The two מפגש 5 gaps Ariel's photographs turned up on 2026-08-11.
//
// **תַבַּע / תַע.** The "תרגול אישי – מפגש 5" table has four columns —
// תַבַּע/תַע, אל, ענד, מע. Three of them were already in the database as
// `possession_ili` / `possession_ind` / `possession_maa`; the possessive column
// was not. There is a `possessive_tabaa` under מפגש 4, but that is a different
// table (it splits by the gender of the possessed noun), so the מפגש 5 column
// was genuinely missing rather than duplicated.
//
// **The 20 ש"ב solution sentences.** These are the homework answers, not the
// p.74 practice sentences already in the database. They go in as a paradigm
// rather than as cards: they are reference material for a completed exercise,
// and a transcription slip in reference material is a wrong line on a page he
// can check, while the same slip on a card is a wrong form he drills to
// automaticity.

export const TABAA_MEETING_5 = {
  slug: "possession_tabaa",
  meeting: 5,
  data: {
    title: "תַבַּע / תַע — שייכות",
    description: "העמודה הרביעית בטבלת התרגול האישי של מפגש 5, לצד אל / ענד / מע",
    note: "תַע היא הצורה המקוצרת של תַבַּע. שתיהן נשמעות ברחוב",
    translations: { tabaa: "תַבַּע", taa: "תַע" },
    rows: [
      { person: "אַנַא", tabaa: "תַבַּעִי", taa: "תַעִי" },
      { person: "אִנְתֵ", tabaa: "תַבַּעַכּ", taa: "תַעַכּ" },
      { person: "אִנְתִי", tabaa: "תַבַּעֵכּ", taa: "תַעֵכּ" },
      { person: "הֻוֵّ", tabaa: "תַבַּעוֹ", taa: "תַעוֹ" },
      { person: "הִיֵّ", tabaa: "תַבַּעַא", taa: "תַעַא" },
      { person: "אִחְנַא", tabaa: "תַבַּעְנַא", taa: "תַעְנַא" },
      { person: "אִנְתוּ", tabaa: "תַבַּעְכֹּם", taa: "תַעְכֹּם" },
      { person: "הֵםّ", tabaa: "תַבַּעְהֹם", taa: "תַעְהֹם" },
    ],
  },
};

/** מפגש 5 — ש"ב, פתרון. Hebrew prompt and the book's own Arabic answer. */
export const HOMEWORK_SOLUTIONS: { num: number; hebrew: string; translit: string }[] = [
  {
    num: 1,
    hebrew: "התמונה הזאת לא שלנו! אולי היא שלכם?",
    translit: "הַ(אל)צוּרַה מֶש אִלְנַא! מֻמְכֵּן הִיֵّ אִלְכֹּם?",
  },
  {
    num: 2,
    hebrew: "הוא אין עימו משקפיים, חבר שלו יש לו משקפיים",
    translit: "הֻוֵّ מַעוּש נַצַّארַאת, צַאחְבּוֹ מַעוֹ נַצַّארַאת",
  },
  {
    num: 3,
    hebrew: "הכסף הזה לא שלך ולא שלי! אולי הכסף שלו?",
    translit: "הַ(א)לְמַצַארִי מֶש אִלַכּ וּמֶש אִלִי! מֻמְכֵּן (א)לְמַצַארִי אִלוֹ?",
  },
  {
    num: 4,
    hebrew: "הוא מרכיב (לובש) משקפיים ועל ראשו כובע גדול",
    translit: "הֻוֵّ לַאבֶּס נַצַّארַאת וְעַלַא רַאסוֹ טַאקִיֵّה כְּבִּירֵה",
  },
  {
    num: 5,
    hebrew: 'יש להם פגישה חשובה במרכז העיר אחרי תפילת אחה"צ',
    translit: "אִלְהֹם מְקַאבַּלֵה מֻהֶמֵّה פִי (מַרְכַּז) קַלְבּ (א)לְמַדִינֵה בַּעַד צַלַאת (א)לְעַצֵר",
  },
  {
    num: 6,
    hebrew: "יש אצלה רשימה עם כל קרובי משפחתה, אולי השם שלו נמצא שם?",
    translit: "פִי עִנְדְהַא לִיסְתַה מַע כֻּל קַרַאיְבְּהַא, מֻמְכֵּן אִסְמוֹ מַוְגִ'וד הְנַאכּ?",
  },
  {
    num: 7,
    hebrew: "אצלנו באמצע המטבח יש שולחן עליו (עליה) סיר וצלחת וכף ומזלג וסכין",
    translit:
      "עִנַّא פִי קַלְבּ (א)לְמַטְבַּח' פִי טַאוְלֵה עַלֵיהַא טַנְגַ'רַה וְצַחֵן וְמַעְלַקַה וְשׁוֹכֵּה וְסַכִּינֵה",
  },
  {
    num: 8,
    hebrew: "האדמה הזאת שלי וכל האדמות סביב לה של דודי (מצד אבי)",
    translit: "הַ(א)לְאַרְצ' אִלִי וְכֻּלّ (א)לְאַרַאצִ'י חַוַאלֵיהַא תַע עַמּוּמִי",
  },
  {
    num: 9,
    hebrew: "זה אבא שלו מנהל חשבונות יש לו משרד באמצע היישוב",
    translit: "הַאדַא אַבּוּה, מְדִיר חְסַאבַּאת, אִלוֹ מַכְּתַבּ פִי מַרְכַּז (א)לְבַּלַד",
  },
  {
    num: 10,
    hebrew: "אין לנו סטודנט (ש)שמו טארק, אולי באוניברסיטה אחרת",
    translit: "מַלְנַאש טַאלֶבּ אִסְמוֹ טַארֵק, מֻמְכֵּן בְּגַ'אמְעַה תַאנְיֵה",
  },
  {
    num: 11,
    hebrew: "זה דבר אחד וזה דבר אחר, הם לא אותו הדבר",
    translit: "הַאדַא אִשִׁי וַאחַד וְהַאדַא אִשִׁי תַאנִי, הֵםّ מֶש נַפֶס (א)לְאִשִׁי",
  },
  {
    num: 12,
    hebrew: "הארנק מלא כסף נמצא בתוך התיבה",
    translit: "אִ(ל)גְ'זְדַאן מַלַאן מַצַארִי, מַוְגִ'וד גֻ'וַّת (אל)צַנְדוּק",
  },
  {
    num: 13,
    hebrew: "אתה אולי יודע או לא יודע, אבל זה מספר הפלאפון שלו",
    translit: "אִנְתֵ מֻמְכֵּן תַעְרֵף אַן מֶש תַעְרֵף, אַמַّא הַאד רַקַם תֶלֶפוֹנוֹ",
  },
  {
    num: 14,
    hebrew: "הפגישה בבית היתומים בנושא הרשיון",
    translit: "אִ(ל)לְקַאא פִי דַאר (א)לְאַיְתַאם פִי מַוְצ'וּע (א)לְרֻחְצַ'ה",
  },
  {
    num: 15,
    hebrew: "באמת מסכנים, המצב אצלם בבית לא טוב בכלל",
    translit: "וַאללַה מַסַאכִּין, (א)לְוַצְ'ע עִנְדְהֹם בּ(א)לְבֵּית מֶש מְנִיח בּ(א)לְמַרַّה",
  },
  {
    num: 16,
    hebrew: "אולי הרשיון והרשימה עימו בארנק, אני לא יודע",
    translit: "בְּגִ'וז (א)לְרֻחְצַ'ה וְ(א)לְלִיסְתַה מַעוֹ בּ(א)לְגְ'זְדַאן, מֶש עַארֵף",
  },
  {
    num: 17,
    hebrew: "על כל מצב, אני אין לי חשק, בסדר?",
    translit: "עַלַא כֻּלّ חַאל, מַלִיש נַפֶס, מַאשִׁי?",
  },
  {
    num: 18,
    hebrew: "היא, אין לה ילדים, יש לה רק בנות",
    translit: "הִיֵّ מַא עִנְדְהַאש וְלַאד, עִנְדְהַא בַּסّ בַּנַאת",
  },
  {
    num: 19,
    hebrew: "יש להם תיבות בבית מלאות בדברים טובים",
    translit: "אִלְהֹם צַנַאדִיק בּ(א)לְבֵּית מַלַאנֵה בְּאַשְׁיַא מְנִיחַה",
  },
  {
    num: 20,
    hebrew: "את יש לך חשבון פה או אין לך חשבון פה?",
    translit: "אִנְתִ עִנְדֵכּ חְסַאבּ הוֹן, אַן מַעִנְדֶכִּש הוֹן?",
  },
];
