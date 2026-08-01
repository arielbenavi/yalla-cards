// chatifai's line-by-line verdicts on the stored simulation_* dialogues.
//
// Only corrections chatifai actually ruled on are recorded. Its "polished
// version" routinely rewrites lines it marked תקין — dropping a clause, adding a
// courtesy turn, merging a branch — and those unrequested structural edits are
// not applied: the multiple-choice branch is the whole point of the feature.
//
// Anything chatifai did not rule on stays as it is. Nothing here is my own
// judgement about Arabic.

export type Cell = { translit: string; ar: string; he: string };

export type LineFix = {
  /** exact existing translit to match */
  match: string;
  reason: string;
  to: Partial<Cell>;
};

export type DialogueFix = {
  slug: string;
  /** chatifai's overall verdict, stored on the row */
  verdict: string;
  fixes: LineFix[];
  /** Unresolved errors — chatifai did not settle these, so the row stays
   *  unverified and unserved until it does. */
  flags?: string[];
  /** Observations that do NOT block verification: style preferences chatifai
   *  offered on lines it marked correct, or questions that span the whole card
   *  set rather than this dialogue. Recorded so the reasoning survives. */
  notes?: string[];
};

export const DIALOGUE_FIXES: DialogueFix[] = [
  {
    slug: "simulation_market",
    verdict:
      "chatifai: needs line fixes — המבנה, המשלב והזרימה תקינים. 6 מתוך 10 שורות עברו נקי. " +
      "השורה החמורה: 'לַחַיִּן' אינה מילה קיימת בהקשר הזה.",
    fixes: [
      {
        match: "אִלְ-כִּילוֹ בְּ-חַ'מְסֵה שֵׁקֶל, בַּס בַּנְדוֹרַה לַחַיִּן.",
        reason:
          "chatifai: \"המילה 'לַחַיִּן' אינה קיימת בהקשר הזה\" — הערבית אף נכתבה במרכאות, " +
          "סימן שגם הכותב לא היה בטוח. הביטוי נמחק ולא הוחלף: chatifai הציע לַקְטַה או לַוְזִין, " +
          "אבל אף אחד מהם לא אושש, והמצאה גרועה ממחיקה.",
        to: {
          translit: "אִלְ-כִּילוֹ בְּ-חַ'מְסֵה שֵׁקֶל.",
          ar: "الكيلو بخمسة شقل.",
          he: "קילו ב-5 שקלים.",
        },
      },
      {
        match: "עַלַא רַאסִי. שׁוּף אִלְ-פַוַאכֵּה, עִנְדִי מַנְגַא זַאי אִלְ-עַסַל.",
        reason: "העמודות לא תואמות: העברית פותחת ב-עַלַא רַאסִי והערבית מדלגת עליו",
        to: { ar: "على راسي. شوف الفواكه، عندي منجا زي العسل." },
      },
      {
        match: "מַאשִי. אִלְ-חִסַאבּ כֻּלּוֹ חַ'מְסֵה וּאַרְבַּעִין שֵׁקֶל.",
        reason:
          "chatifai: \"אומרים חַ'מְסֵה וְאַרְבְּעִין\" — גם ה-ו׳ וגם תנועת ה-ב׳ משתנות",
        to: {
          translit: "מַאשִי. אִלְ-חִסַאבּ כֻּלּוֹ חַ'מְסֵה וְאַרְבְּעִין שֵׁקֶל.",
          he: "בסדר. החשבון הכל 45 שקל.",
        },
      },
    ],
    notes: [
      "register — chatifai מעדיף יַא חַבִּיבִּי על יַא עַזִיזִי בשוק, ו-בְּקַדֵּיש על שׁוּ סִעֵר. " +
        "לא הוחל: אלה העדפות סגנון ולא שגיאות, והוא סימן את שתי השורות תקינות.",
      "שקל — chatifai מציע שֵׁיכֵּל / شيكل במקום שֵׁקֶל / شقل. לא הוחל: זו מוסכמה שרצה " +
        "לרוחב כל מאגר הכרטיסים ולא החלטה של דו-שיח בודד. נשלחה שאלה ייעודית.",
      "chatifai סימן את שורה 7 (חֻ'צְ'רַה) כטעונת תיקון ל-צ׳ — אבל היא כבר הייתה צ׳. " +
        "התרעת שווא שלו, לא שגיאה בנתונים.",
    ],
  },
  {
    slug: "simulation_shawarma",
    verdict:
      'chatifai: "הדו-שיח טוב ב-80%, אבל כדי להישמע מקומי באמת, כדאי להשתמש בגרסה המלוטשת". ' +
      "8 מתוך 11 שורות עברו נקי; שורות 1, 2 ו-4 תוקנו. הוא בדק טבעיות ותעתיק עברי בלבד — " +
      "עמודת הערבית לא נבדקה במעבר הזה.",
    fixes: [
      {
        match: "אַהְלַן יַא עַמִּי, שׁוּ בִּדִּי אַטְעִימַכּ אִלְ-יוֹם?",
        reason:
          'chatifai: "מוכר לא אומר \'מה אני רוצה להאכיל אותך\'. זה נשמע כמו אמא שמדברת לילד קטן."',
        to: {
          translit: "אַהְלַן יַא עַמִּי, תְפַצַּ'ל, שׁוּ בִּדַּכּ?",
          ar: "أهلا يا عمي، تفضّل، شو بدك؟",
          he: "אהלן יא עמי, בבקשה, מה אתה רוצה?",
        },
      },
      {
        match: "בִּדִּי וַאחַד שׁוַארְמַא, בַּס בִּדִּי אִיַּאהַא בִּלְ-חֻ'בְּז אִלְ-עַאדִי.",
        reason: "שגיאת מין — סנדוויץ׳ הוא זכר, אז אִיַּאה ולא אִיַּאהַא; chatifai גם מעדיף סַנְדְוִיש",
        to: {
          translit: "בִּדִּי סַנְדְוִיש שׁוַארְמַא, בַּס בִּדִּי אִיַּאה בִּחֻ'בְּז עַאדִי.",
          ar: "بدي سندويش شاورما، بس بدي إياه بخبز عادي.",
          he: "אני רוצה סנדוויץ' שווארמה, אבל בלחם רגיל.",
        },
      },
      {
        match: "לַחְמֵה, וּכְּתִיר אִלְ-טַחִינֵה.",
        reason: 'chatifai: "נשמע כמו רשימת מכולת. בדוכן אומרים \'תכביד את הטחינה\'."',
        to: {
          translit: "לַחְמֵה, וְכַּתִּ'רְלִי (אִל)טַּחִינֵה.",
          ar: "لحمة، وكثّرلي الطحينة.",
          he: "בשר, ותכביד לי את הטחינה.",
        },
      },
    ],
  },
  {
    slug: "simulation_taxi",
    verdict:
      "chatifai: \"הדו-שיח מספיק טוב ללימוד, אבל הוא צריך תיקוני שורות\". 5 שורות תקינות, " +
      "אחת שבורה לגמרי (מוחד — מילה שאינה קיימת, בשתי העמודות), ובעיית יידוע שיטתית בתעתיק.",
    fixes: [
      {
        match: "אַה פַאצִ'י, עַ-וֵין אִן שַׁאא אִללַּה?",
        reason: "אִן שַׁאא אִללה הוא כתיב ספרותי; במדוברת נהגית מילה אחת רציפה",
        to: { translit: "אַה פַאצִ'י, עַ-וֵין אִנְשַׁאללַה?" },
      },
      {
        match: "בִּדִּי אִלְ-מֻסְתַשְׁפַא אִלְ-פְרַנְסִי, בְּתִעְרֵף וֵין?",
        reason: "יידוע: ה-א׳ נבלעת. וגם בִּתִעְרֵף בחיריק, לא בְּתִעְרֵף בשווא",
        to: { translit: "בִּדִּי (אִל)מֻסְתַשְׁפַא (אִל)פְרַנְסִי, בִּתִעְרֵף וֵין?" },
      },
      {
        match: "אַה אַכִּיד, בַּס פִי זַחְמֵה כְּבִּירֵה פִי אִלְ-טַרִיק.",
        reason: "ט׳ היא אות שמש — ה-ל׳ נבלעת וה-ט׳ מודגשת",
        to: { translit: "אַה אַכִּיד, בַּס פִי זַחְמֵה כְּבִּירֵה בִּ(א)טַּרִיק." },
      },
      {
        match: "מֻשׁ מֻשְׁכִּלֵה, אֲנַא מֻוְחִ'ד וַקְתִי.",
        reason:
          'chatifai: "\'מוחד\' אינה מילה קיימת" — וגם "אני לוקח את הזמן שלי" הוא תרגום מעברית. ' +
          "השגיאה בשתי העמודות: موخد במקום ماخد",
        to: {
          translit: "מֻשׁ מֻשְׁכִּלֵה, אַנַא מֻשׁ מֻסְתַעְגִ'ל.",
          ar: "مش مشكلة، أنا مش مستعجل.",
          he: "לא בעיה, אני לא ממהר.",
        },
      },
      {
        match: "טַיֵּבּ, אִטְלַע. שׁוּ בִּדַּכּ, אַשַׁעְ'עִ'ל אִלְ-עַדַּאד?",
        reason: "התעתיק הכפיל את ה-ע׳ בטעות; הערבית أشغل תקינה",
        to: { translit: "טַיֵּבּ, אִטְלַע. שׁוּ בִּדַּכּ, אַשַׁעְ'ל (אִל)עַדַּאד?" },
      },
      {
        match: "נַזִּלְנִי הוֹן גַ'מְבּ אִלְ-בַּנְכּ, יִסְלַמוּ.",
        reason: "יידוע",
        to: { translit: "נַזִּלְנִי הוֹן גַ'מְבּ (אִל)בַּנְכּ, יִסְלַמוּ." },
      },
    ],
  },
];
