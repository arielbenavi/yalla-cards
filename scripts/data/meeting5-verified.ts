// מפגש 5 — chatifai's rulings, verbatim.
//
// Every row is exactly what chatifai printed: its Arabic, its pointed
// transliteration, its gloss. Where it corrected the book, the correction is in
// the `was` field so the change is visible and reversible.
//
// HELD BACK, not inserted — see MEETING5_OPEN_QUESTIONS at the bottom.

export type V = {
  translit: string;
  ar: string;
  he: string;
  plural?: string;
  plural_ar?: string;
  /** the book's or Ariel's form, when chatifai changed it */
  was?: string;
  note?: string;
};

/** From Ariel's notes — these had no nikud at all until now. */
export const NOTES: V[] = [
  { translit: "כְּוַיֵּס", ar: "كويس", he: "טוב / בסדר" },
  { translit: "מַלַאנֵה", ar: "ملانة", he: "מלאה", note: "נקבה של מַלַאן" },
  { translit: "דַ'בַּאח", ar: "ذباح", he: "שוחט", was: "דבאח" },
  { translit: "פִכְּרַה", ar: "فكرة", he: "רעיון" },
  { translit: "נַצִיחַה", ar: "نصيحة", he: "עצה", was: "מציחה", note: "chatifai: ص ולכן צ בלי גרש" },
  { translit: "שַׁרַף", ar: "شرف", he: "כבוד" },
  { translit: "תַאְרִיבַּן", ar: "تقريباً", he: "בערך" },
  { translit: "מַסְכִּינֵה", ar: "مسكينة", he: "מסכנה" },
  { translit: "יַתִימֵה", ar: "يتيمة", he: "יתומה" },
  { translit: "נַפְסִ (א)לְאִשִי", ar: "نفس الإشي", he: "אותו דבר" },
  { translit: "נַפְסִי", ar: "نفسي", he: "מאוד רוצה", note: "חזק יותר מבִּדִּי" },
  { translit: "וַאללַּהִי", ar: "والله", he: "ואללה (הדגשת שבועה)" },
  { translit: "גִ'סֵר", ar: "جسر", he: "גשר" },
  {
    translit: "מְצַ'דִּי",
    ar: "مصدي",
    he: "חלוד / ג'ינג'י (סלנג)",
    note: "chatifai: נגזר מ-צַ'דַא. 'יַא מְצַ'דִּי' הוא לעג קל — לא קללה, אבל לא מנומס",
  },
  { translit: "צַ'דַא", ar: "صدأ", he: "חלודה", note: "chatifai: האות ص, אבל נשמעת נחצית ליד ד ולכן צ'" },
  { translit: "דַ'הַבּ", ar: "ذهب", he: "זהב", was: "דהב" },
  { translit: "אַצִיר", ar: "قصير", he: "קצר" },
  { translit: "עַצִיר", ar: "عصير", he: "מיץ" },
  { translit: "שַׁאטֵר", ar: "شاطر", he: "חכם", plural: "שַׁאטְרִין" },
  {
    translit: "סַכַּנִיֵּה",
    ar: "سكنية",
    he: "אפורה",
    was: "כסופה",
    note: "chatifai תיקן את הפירוש: מ-סַכַּן (אפר). כסופה היא פִצִּ'יֵّה",
  },
  { translit: "קַבֵּל סֵיעַתֵין", ar: "قبل ساعتين", he: "לפני שעתיים" },
  { translit: "בַּנְכּ תַאנִי", ar: "بنك تاني", he: "בנק אחר" },
  { translit: "נַאס טַיְּבִּין", ar: "ناس طيبين", he: "אנשים טובים" },
];

/** The colour patterns. chatifai corrected five of the book's forms. */
export const COLOURS: (V & { f: string; f_ar: string; pl: string; pl_ar: string })[] = [
  { translit: "אַצְפַר", ar: "أصفر", he: "צהוב", f: "צַפְרַא", f_ar: "صفراء", pl: "צֻפֹר", pl_ar: "صفر" },
  { translit: "אַזְרַא", ar: "أزرق", he: "כחול", was: "אַזְרַק", f: "זַרְקַא", f_ar: "زرقاء", pl: "זֻרֹק", pl_ar: "زرق" },
  { translit: "אַחְ'צַ'ר", ar: "أخضر", he: "ירוק", f: "חַ'צְ'רַא", f_ar: "خضراء", pl: "חֻ'צֹ'ר", pl_ar: "خضر" },
  { translit: "אַחְמַר", ar: "أحمر", he: "אדום", f: "חַמְרַא", f_ar: "حمراء", pl: "חֻמֹר", pl_ar: "حمر" },
  { translit: "אַשְׁאַר", ar: "أشقر", he: "בלונדיני", was: "אַשְקַר", f: "שַׁקְרַא", f_ar: "شقراء", pl: "שֻׁאֹר", pl_ar: "شقر" },
  { translit: "אַסְמַר", ar: "أسمر", he: "שחום", f: "סַמְרַא", f_ar: "سمراء", pl: "סֻמֹר", pl_ar: "سمر" },
  { translit: "אַסְוַד", ar: "أسود", he: "שחור", f: "סַוְדַא", f_ar: "سوداء", pl: "סוּד", pl_ar: "سود" },
  { translit: "אַבְּיַצ'", ar: "أبيض", he: "לבן", f: "בֵּיצַ'א", f_ar: "بيضاء", pl: "בִּיצ'", pl_ar: "بيض" },
];

export const COLOURS_EXTRA: V[] = [
  { translit: "עַסַלִי", ar: "عسلي", he: "חום (דבש)" },
  { translit: "קַמְחִי", ar: "قمحي", he: "חום (חיטה)" },
  { translit: "רַמַאדִי", ar: "رمادي", he: "אפור" },
  { translit: "סַכַּנִי", ar: "سكني", he: "אפור" },
  { translit: "רַצַאצִי", ar: "رصاصي", he: "אפור" },
  { translit: "בֻּנִי", ar: "بني", he: "חום" },
  { translit: "שַטִינִי", ar: "شطيني", he: "חום בהיר" },
  { translit: "בֻּרְתֻקַאלִי", ar: "برتقالي", he: "כתום", note: "chatifai: בעירוני בֻּרְתֻאַאלִי" },
  { translit: "בֻּרְדְקַאנִי", ar: "بردقاني", he: "כתום" },
  { translit: "בַּנַפְסַגִ'י", ar: "بنفسجي", he: "סגול" },
  { translit: "לֵילַכִּי", ar: "ليلكي", he: "סגול" },
  { translit: "וַרְדִי", ar: "وردي", he: "ורוד" },
  { translit: "זַהְרִי", ar: "زهري", he: "ורוד" },
  { translit: "פִצִּ'י", ar: "فضي", he: "כסוף", was: "פִצְّי", note: "chatifai: צ' של ض, לא צ" },
  { translit: "דַהְבִּי", ar: "ذهبي", he: "מוזהב" },
  { translit: "סַמַאוִי", ar: "سماوي", he: "תכלת" },
  { translit: "בַּטוֹנִי", ar: "بطوني", he: "צבע בטון" },
  { translit: "שַפַּאף", ar: "شفاف", he: "שקוף" },
  { translit: "מְלַוַּן", ar: "ملون", he: "צבעוני" },
  { translit: "פַאתֵח", ar: "فاتح", he: "בהיר" },
  { translit: "עַ'אמֵא", ar: "غامق", he: "כהה", was: "עַ'אמֵק" },
  { translit: "לַאמֵע", ar: "لامع", he: "בוהק, מבריק" },
];

/** The book's vocabulary list, with chatifai's Arabic and corrections. */
export const BOOK: V[] = [
  { translit: "מַצַארִי", ar: "مصاري", he: "כסף" },
  { translit: "פְלוּס", ar: "فلوس", he: "כסף" },
  { translit: "אַבּוּ", ar: "أبو", he: "בעל תכונה / אבא של.. / בערך" },
  { translit: "נַצַּ'ארַאת", ar: "نظارات", he: "משקפיים", was: "נַצַّארַאת", note: "chatifai: ظ ולכן צ' עם גרש" },
  { translit: "נַצַּ'ארַה", ar: "نظارة", he: "משקפת / משקף יחיד", was: "נַצַّארַה" },
  { translit: "מַעְלַאַה", ar: "معلقة", he: "כף", plural: "מַעַאלֵא", plural_ar: "معالق", was: "מַעְלַקַה" },
  { translit: "סַכִּינֵה", ar: "سكينة", he: "סכין", plural: "סַכַּאכִּין", plural_ar: "سكاكين" },
  { translit: "טַנְגַ'רַה", ar: "طنجرة", he: "סיר", plural: "טַנַאגֵ'ר", plural_ar: "طناجر" },
  { translit: "שַוַארֵבּ", ar: "شوارب", he: "שפם" },
  { translit: "צוּרַה", ar: "صورة", he: "תמונה", plural: "צֻוַר", plural_ar: "صور" },
  { translit: "צַחֵן", ar: "صحن", he: "צלחת", plural: "צְחוּן", plural_ar: "صحون" },
  { translit: "צַנְדוּא", ar: "صندوق", he: "תיבה, קופה", plural: "צַנַאדִיא", plural_ar: "صناديق", was: "צַנְדוּק" },
  { translit: "לִיסְתַה", ar: "ليستة", he: "רשימה" },
  { translit: "טַאקִיֵּה", ar: "طاقية", he: "כובע", plural: "טַוַאקִי", plural_ar: "طواقي" },
  { translit: "אַרְצ'", ar: "أرض", he: "אדמה", plural: "אַרַאצִ'י", plural_ar: "أراضي" },
  { translit: "רֻחְ'צַה", ar: "رخصة", he: "רישיון, אישור", plural: "רֻחַ'ץ", plural_ar: "رخص", was: "רֵחְ'צַה" },
  { translit: "אַריבּ", ar: "قريب", he: "קרוב משפחה / קרוב במרחק", plural: "אַראיֵבּ", plural_ar: "قرايب", was: "קַרִיבּ" },
  { translit: "מֻמְכֵּן", ar: "ممكن", he: "אולי, אפשרי" },
  { translit: "יִמְכֵּן", ar: "يمكن", he: "אולי, אפשרי", was: "יֻמְכֵּן" },
  { translit: "בַּלְכִּי", ar: "بلكي", he: "אולי, אפשרי" },
  { translit: "מִסְכִּין", ar: "مسكين", he: "מסכן", plural: "מַסַאכִּין", plural_ar: "مساكين" },
  { translit: "בַּס", ar: "بس", he: "רק" },
  { translit: "פַקַט", ar: "فقط", he: "רק" },
  { translit: "יַתִים", ar: "يتيم", he: "יתום", plural: "אַיְתַאם", plural_ar: "أيتام" },
  { translit: "חְסַאבּ", ar: "حساب", he: "חשבון" },
  { translit: "אַו", ar: "أو", he: "או (באמירה)" },
  { translit: "וְלַּא", ar: "ولا", he: "או (בשאלה)" },
  { translit: "מֻאַאבַּלֵה", ar: "مقابلة", he: "פגישה", was: "מְקַאבַּלֵה" },
  { translit: "לִאַא", ar: "لقاء", he: "פגישה", was: "לְקַא" },
  { translit: "גֻ'זְדַאן", ar: "جزادان", he: "ארנק", plural: "גְ'זַאדִין", plural_ar: "جزادين", was: "גְ'זְדַאן" },
  { translit: "מַרְכַּז", ar: "مركز", he: "מרכז" },
  { translit: "אַלְבּ", ar: "قلب", he: "לב", plural: "אֻלוּבּ", plural_ar: "قلوب", was: "קַלְבּ" },
  { translit: "נַפְס", ar: "نفس", he: "נפש, רצון, חשק", plural: "נְפוּס", plural_ar: "نفوس" },
  { translit: "אִשִי", ar: "إشي", he: "דבר, משהו, עניין", plural: "אַשְיַא", plural_ar: "أشياء" },
  { translit: "תַאנִי", ar: "تاني", he: "שני, אחר" },
  { translit: "תַאנְיֵה", ar: "تانية", he: "שנייה, אחרת" },
  { translit: "לַאבֵּס", ar: "لابس", he: "לובש" },
  { translit: "רַאס", ar: "راس", he: "ראש", plural: "רוּס", plural_ar: "روس" },
  { translit: "מֻהִם", ar: "مهم", he: "חשוב, משמעותי", was: "מְהֵםّ", note: "chatifai: יש שדה על המ' הסופית — Muhimm" },
  { translit: "הַם", ar: "هم", he: "דאגה, צער", plural: "הֻמוּם", plural_ar: "هموم" },
  { translit: "כִּלְמֵה", ar: "كلمة", he: "מילה", was: "כְּלְמֵה" },
  { translit: "כַּלַאם", ar: "كلام", he: "דיבורים (שם קיבוצי)" },
  { translit: "מֻכַּאלַמֵה", ar: "مكالمة", he: "שיחה", was: "מְכַּאלַמֵה" },
  { translit: "עַארֵף", ar: "عارف", he: "יודע" },
  { translit: "שַאיֵף", ar: "شايف", he: "רואה" },
  { translit: "רַקַם", ar: "رقم", he: "מספר" },
  { translit: "מַוְצ'וּע", ar: "موضوع", he: "נושא" },
  { translit: "וַצֵ'ע", ar: "وضع", he: "מצב", was: "וַצְ'ע" },
  { translit: "חַאל", ar: "حال", he: "מצב, מקרה" },
  { translit: "כִּיף", ar: "كيف", he: "איך", note: "chatifai: כִּיף בחיריק = איך; כֵּיף בצירה = הנאה. אותו כתיב ערבי" },
  { translit: "כֵּיף", ar: "كيف", he: "הנאה, תענוג" },
  { translit: "מַאשִי", ar: "ماشي", he: "הולך (משמש גם: בסדר)" },
  { translit: "צַרַאחַה", ar: "صراحة", he: "כנות, גילוי לב" },
  { translit: "טַיֵּבּ", ar: "طيب", he: "טוב, בסדר" },
  { translit: "תַמַאם", ar: "تمام", he: "מושלם, שלם, בדיוק" },
  { translit: "וְלַא", ar: "ولا", he: "שום, אף אחד", note: "chatifai: וְלַא וַאחַד" },
  { translit: "מַטְ'בּוּט", ar: "مظبوط", he: "מדויק, נכון" },
];

/** NOT inserted. Each needs chatifai to rule again before it can go in. */
export const MEETING5_OPEN_QUESTIONS = [
  "בֵּלֵפוֹן — chatifai החזיר תִלִפוֹן / تلفون ואמר שה-ב' בספר 'כנראה טעות הקלדה'. " +
    "אבל הספר מתרגם 'פלאפון', והמילה بلفون נשאלה מהמותג הישראלי לטלפון נייד. " +
    "נראה שהוא פספס את הכוונה. הכרטיס מוחזק עד שנשאל שוב.",
  "ق — זו הפעם השלישית שהוא לא עקבי. כאן הוא המיר חלק (אַלְבּ, אַריבּ, מַעְלַאַה, " +
    "צַנְדוּא, אַזְרַא, עַ'אמֵא) והשאיר חלק (קַבֵּל, זַרְקַא, שַׁקְרַא, קַמְחִי, בַּנְכּ). " +
    "בתוך שורה אחת נתן אַזְרַא אבל זַרְקַא. הרשימות נשמרות כפי שהדפיס אותן; " +
    "המרה גורפת מחכה להכרעה אחת ברורה.",
  "סֵיעַתֵין — נראה חריג ל-ساعتين. נשאל ישירות ואושר במפורש, אבל ראוי לאימות נוסף.",
];
