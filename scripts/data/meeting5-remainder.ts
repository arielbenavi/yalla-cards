// The last 14 מפגש 5 words, ruled by chatifai after the coverage check was
// fixed. (It had been comparing the book's spellings against chatifai's
// corrected ones, and stripping only Hebrew marks, so it reported 36 missing
// when 14 were.)
//
// Seven are feminine forms whose masculine Ariel already has. His rule for them,
// given unprompted: the tā marbūṭa is ֵה, except after an emphatic or guttural,
// where it is ַה — which is why מְנִיחַה and מַטְ'בּוּטַה differ from לַאבְּסֵה
// and עַארְפֵה.
export type V = { translit: string; ar: string; he: string; was?: string; note?: string };

export const REMAINDER: V[] = [
  { translit: "לַאבְּסֵה", ar: "لابسة", he: "לובשת" },
  {
    translit: "מֻהִמֵּה",
    ar: "مهمة",
    he: "חשובה",
    was: "מְהֵמֵּה",
    note: "chatifai: הניקוד המדויק מֻ-הִ-מֵّה (שורש ה.מ.מ) — שינה גם את התנועות",
  },
  { translit: "עַארְפֵה", ar: "عارفة", he: "יודעת" },
  { translit: "שַאיְפֵה", ar: "شايفة", he: "רואה (נ)" },
  { translit: "מְנִיחַה", ar: "منيحة", he: "טובה", note: "chatifai: חַה בגלל ה-ח' הגרונית בסוף" },
  {
    translit: "מַאשְיֵה",
    ar: "ماشية",
    he: "הולכת / זורמת",
    note: "chatifai: משמש גם כ'הכל בסדר' — מַאשְיֵה אִל-אֻמוּר",
  },
  {
    translit: "מַטְ'בּוּטַה",
    ar: "مضبوطة",
    he: "מדויקת / נכונה",
    note:
      "chatifai: טַה בגלל ה-ט' הכבדה. בטבלה הוא הדפיס 'מזבוטה' בעברית בעמודת " +
      "הערבית; כשנשאל אמר שהכתיב הערבי הוא مضبوطة, ושכתב זאת כדי להסביר " +
      "שה-ض נהגית כשילוב של ד' ו-ז' כבדה",
  },
  {
    translit: "וַאללַּהִ",
    ar: "واللهِ",
    he: "בחיי אלוהים!",
    was: "וללהי",
    note: "chatifai: הדגשה חזקה (שבועה) — תנועת i בסוף. רציני יותר מ-וַאללַה",
  },
  { translit: "גִ'סֵר", ar: "جسر", he: "גשר", was: "ג'יסר", note: "chatifai: חיריק ב-ג', צירה ב-ס'" },
  {
    translit: "נַפְס אִל-אִשִי",
    ar: "نفس الإشي",
    he: "אותו דבר",
    was: "נפס אשי",
    note: "chatifai: הוסיף את ה' הידיעה — ברחוב אומרים Nafs-il-ishi",
  },
  {
    translit: "קַבֵּל סֵיעְתֵין",
    ar: "قبل ساعتين",
    he: "לפני שעתיים",
    was: "קבל סעתין",
    note:
      "chatifai: 'שעה' היא סֵיעַה; לזוגי הופכים ה' ל-ת' ומוסיפים ֵין. " +
      "על ה-ق ב-קַבֵּל: 'נשארת לרוב ק בלהג הכפרי, אבל בערים יגידו אַבֵּל'",
  },
];

/**
 * Held back — not because the ruling is unclear, but because it collides with a
 * decision that is still Ariel's to make.
 *
 * chatifai transliterated ق as א in these, consistently with its own ruling in
 * scripts/data/qaf-ruling.ts. The cards are still uniformly ק, because that
 * conversion has not been applied — it rewrites text on 24 cards with review
 * history. Inserting these three as א would put new cards on one side of a
 * convention while every existing card sits on the other, which is worse than
 * either choice made whole.
 *
 * They go in the moment the ق decision is made, in whichever form it takes.
 */
export const HELD_ON_QAF: V[] = [
  {
    translit: "שֻאֹר",
    ar: "شقر",
    he: "בלונדינים",
    was: "שֻקֹר",
    note: "chatifai: זכר אַשְקַר · נקבה שַאְרַא · רבים שֻאֹר. ה-ق הופכת ל-א'",
  },
  {
    translit: "תַאְרִיבַּן",
    ar: "تقريباً",
    he: "בערך / בקירוב",
    was: "תקריבן",
    note: "chatifai: ה-ق הופכת ל-א' (עצירה). נשמע Ta-riban. נפוץ מאוד בסוף משפט",
  },
  {
    translit: "מַעְלַאֵה זְעִ'ירֵה",
    ar: "معلقة صغيرة",
    he: "כפית",
    was: "מַעְלַקַה זְעִ'ירַה",
    note:
      "chatifai: הצורה הרווחת, אין מילה אחת לכפית. הדפיס מַעְלַקַה בעמודת המילה " +
      "ומַעְלַאֵה בעמודת התעתיק — התעתיק הוא מה שהוא מאשר. גם זְעִ'ירֵה בצירה, " +
      "לא זְעִ'ירַה",
  },
];
