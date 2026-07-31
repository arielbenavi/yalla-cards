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
  /** cells chatifai did not settle; keeps the row unverified if non-empty */
  flags?: string[];
};

export const DIALOGUE_FIXES: DialogueFix[] = [
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
