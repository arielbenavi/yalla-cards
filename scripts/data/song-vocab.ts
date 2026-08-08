// Vocabulary drawn from the three non-Palestinian songs in Ariel's playlist.
//
// A **deduplicated word list**, not the songs. Sorted by song only so the
// dialect note can say where each came from; nothing here preserves line order
// and nothing here reconstructs a verse.
//
// The third column is the point of the whole exercise. Ariel learns Palestinian
// and these songs are Egyptian and Lebanese, so his ruling stands: keep the
// words, mark every divergence, give the Palestinian form beside the song's.
//
// `pal` is filled only where chatifai said the Palestinian form differs.
export type SongWord = {
  ar: string;
  translit: string;
  he: string;
  /** Palestinian equivalent, where chatifai marked a divergence. */
  pal?: string;
  song: "براحة يا شيخة" | "Konna Netlaka" | "ولا مرة";
  note?: string;
};

export const SONG_VOCAB: SongWord[] = [
  // ── مصري: براحة يا شيخة ──
  { ar: "اجازه", translit: "אִגַ'אזַה", he: "חופשה", song: "براحة يا شيخة",
    pal: "אִגַ'אזַה (ג' רכה)", note: "chatifai: במצרית ה-ج נשמעת G" },
  { ar: "الدلال", translit: "אִדַלַאל", he: "פינוק / פלירטוט", song: "براحة يا شيخة" },
  { ar: "سهوه", translit: "סַהְוֵה", he: "הסחת דעת / טעות", song: "براحة يا شيخة" },
  { ar: "النظام", translit: "אִנִּטַ'אם", he: "המערכת / הסדר", song: "براحة يا شيخة",
    note: "chatifai: בפלסטינית ה-ظ נשמעת לעיתים כד' נחצית" },
  { ar: "اتلغبط", translit: "אִתְלַעְ'בַּט", he: "התבלבלתי", song: "براحة يا شيخة",
    note: "chatifai: נפוצה מאוד בשני הלהגים" },
  { ar: "براحه", translit: "בִּרַאחַה", he: "בנחת / לאט", song: "براحة يا شيخة" },
  { ar: "شويه", translit: "שְוַיֵה", he: "קצת", song: "براحة يا شيخة",
    note: "chatifai: מילת מפתח בשני הלהגים" },
  { ar: "شخشيخه", translit: "שַחְשֵיחַ'ה", he: "רעשן", song: "براحة يا شيخة" },
  { ar: "غلابه", translit: "עַ'לַאבַּה", he: "מסכנים / עניים", song: "براحة يا شيخة" },
  { ar: "نار", translit: "נַאר", he: "אש", song: "براحة يا شيخة" },
  { ar: "دمار", translit: "דַמַאר", he: "חורבן / הרס", song: "براحة يا شيخة" },
  { ar: "سكينه", translit: "סִכִּינֵה", he: "סכין", song: "براحة يا شيخة" },
  { ar: "القوام", translit: "אִלְקַוַאם", he: "גזרה (גוף)", song: "براحة يا شيخة",
    pal: "אִלְקַוַאם · עירוני אִלְאַוַאם", note: "chatifai: במצרית אִלְאַוַאם" },
  { ar: "غزال", translit: "עַ'זַאל", he: "צבי (כינוי ליופי)", song: "براحة يا شيخة" },
  { ar: "تدبحنا", translit: "תִדְבַּחְנַא", he: "תשחט אותנו", song: "براحة يا شيخة" },
  { ar: "بارد", translit: "בַּארֵד", he: "קר / אדיש", song: "براحة يا شيخة" },
  { ar: "احتمال", translit: "אִחְתִמַאל", he: "סיכוי / אפשרות", song: "براحة يا شيخة" },
  { ar: "القمر", translit: "אִלְקַמַר", he: "הירח", song: "براحة يا شيخة",
    pal: "אִלְקַמַר · עירוני אִלְאַמַר", note: "chatifai: במצרית אִלְאַמַר" },
  { ar: "الساحة", translit: "אִסַּאחַה", he: "הזירה / החצר", song: "براحة يا شيخة" },
  { ar: "قتال", translit: "קַתַּאל", he: "קטלני / רוצח", song: "براحة يا شيخة",
    pal: "קַתַּאל · בערים אַתַּאל", note: "chatifai: במצרית אַתַּאל" },
  { ar: "الضحايا", translit: "אִדַּ'חַאיַא", he: "הקורבנות", song: "براحة يا شيخة" },
  { ar: "المنافسه", translit: "אִלְמֻנַאפַסַה", he: "התחרות", song: "براحة يا شيخة" },
  { ar: "الجمال", translit: "אִלְגַ'מַאל", he: "היופי", song: "براحة يا شيخة",
    pal: "אִלְגַ'מַאל (J)", note: "chatifai: במצרית אִלְגַמַאל (G)" },

  // ── لبناني: Konna Netlaka ──
  { ar: "عشية", translit: "עַשִׁיֵּה", he: "ערב / בערב", song: "Konna Netlaka",
    note: "chatifai: משמש גם בפלסטינית לשעות הערב המוקדמות" },
  { ar: "نقعد", translit: "נִקְעֹד", he: "נשב", song: "Konna Netlaka",
    note: "chatifai: בעיר נִאְעֹד" },
  { ar: "الجسر", translit: "אִלְגִ'סֵר", he: "הגשר", song: "Konna Netlaka" },
  { ar: "السهل", translit: "אִסַּהֵל", he: "העמק / המישור", song: "Konna Netlaka" },
  { ar: "الضبابي", translit: "אִדַּ'בַּאבִּי", he: "הערפילי", song: "Konna Netlaka",
    note: "chatifai: ספרותי; ברחוב פִי צְ'בַּאבּ" },
  { ar: "تمحي", translit: "תִמְחִי", he: "תמחוק", song: "Konna Netlaka" },
  { ar: "المدى", translit: "אִלְמַדַא", he: "המרחב / האופק", song: "Konna Netlaka" },
  { ar: "الطريق", translit: "אִטַּרִיק", he: "הדרך / הכביש", song: "Konna Netlaka",
    note: "chatifai: בעיר אִטַּרִיא" },
  { ar: "حدا", translit: "חַדַא", he: "מישהו / אף אחד", song: "Konna Netlaka",
    note: "chatifai: מילה מאוד פלסטינית — פִיש חַדַא = אין אף אחד" },
  { ar: "مطرح", translit: "מַטְרַח", he: "מקום", song: "Konna Netlaka",
    note: "chatifai: נפוץ מאוד בשוק וברחוב" },
  { ar: "السما", translit: "אִסַּמַא", he: "השמיים", song: "Konna Netlaka" },
  { ar: "ورق", translit: "וַרַק", he: "דפים / עלים", song: "Konna Netlaka" },
  { ar: "تشرين", translit: "תִשְרִין", he: "אוקטובר/נובמבר", song: "Konna Netlaka" },
  { ar: "يهرب", translit: "יִהְרַבּ", he: "יברח", song: "Konna Netlaka" },
  { ar: "الغيم", translit: "אִלְעֵ'יְם", he: "העננים", song: "Konna Netlaka" },
  { ar: "الحزين", translit: "אִלְחַזִין", he: "העצוב", song: "Konna Netlaka" },
  { ar: "سنين", translit: "סְנִין", he: "שנים", song: "Konna Netlaka" },
  { ar: "إرجعلي", translit: "אִרְגַ'עְלִי", he: "תחזור אליי", song: "Konna Netlaka" },
  { ar: "إنسيني", translit: "אִנְסִינִי", he: "תשכח אותי", song: "Konna Netlaka" },
  { ar: "الطفولة", translit: "אִטֻּפוּלֵה", he: "הילדות", song: "Konna Netlaka" },
  { ar: "الطرقات", translit: "אִטֻּרֻקַאת", he: "הדרכים", song: "Konna Netlaka",
    note: "chatifai: בעיר אִטֻּרֻאַאת" },
  { ar: "ضحكات", translit: "צִ'חְכַּאת", he: "צחוקים", song: "Konna Netlaka" },
  { ar: "زوايا", translit: "זַוַאיַא", he: "פינות", song: "Konna Netlaka" },
  { ar: "نطرت", translit: "נַטַרְת", he: "חיכיתי", song: "Konna Netlaka",
    note: "chatifai: לבנטינית קלאסית, במקום אִסְתַנֵית" },
  { ar: "الشتا", translit: "אִשִּתַא", he: "החורף / הגשם", song: "Konna Netlaka" },

  // ── لبناني: ولا مرة ──
  { ar: "ولا مرة", translit: "וַלַא מַרַּה", he: "אף פעם / אף פעם לא", song: "ولا مرة",
    note: "chatifai: ביטוי נפוץ מאוד ברחוב הפלסטיני" },
  { ar: "سوا", translit: "סַוַא", he: "ביחד", song: "ولا مرة",
    note: "chatifai: בפלסטינית משתמשים גם ב-מַע בַּעַצ'" },
  { ar: "جمعنا", translit: "גַ'מַעְנַא", he: "אסף / איחד אותנו", song: "ولا مرة" },
  { ar: "الهوى", translit: "אִלְהַוַא", he: "האהבה / הרוח", song: "ولا مرة" },
  { ar: "لما", translit: "לַמַּא", he: "כאשר / כש...", song: "ولا مرة" },
  { ar: "شافت", translit: "שַאפַת", he: "ראתה", song: "ولا مرة" },
  { ar: "غارت", translit: "עַ'ארַת", he: "קינאה", song: "ولا مرة" },
  { ar: "سهران", translit: "סַהְרַאן", he: "ער בלילה / מבלה", song: "ولا مرة" },
  { ar: "اتمنى", translit: "אַתְמַנַּא", he: "אני מקווה / מייחל", song: "ولا مرة",
    note: "chatifai: בלבנונית הסוף נשמע E, בפלסטינית A ברורה" },
  { ar: "بقرب", translit: "בִּקֻרְבּ", he: "בקרבת / ליד", song: "ولا مرة",
    note: "chatifai: בעיר בִּאֻרְבּ" },
  { ar: "اتهنى", translit: "אִתְהַנַּא", he: "אהנה / אתענג", song: "ولا مرة",
    note: "chatifai: ברכה נפוצה תִתְהַנַּא = תתחדש/תהנה" },
  { ar: "إيدي", translit: "אִידִי", he: "היד שלי", song: "ولا مرة" },
  { ar: "تلامس", translit: "תְלַאמֵס", he: "תיגע / תלטף", song: "ولا مرة" },
  { ar: "غنيت", translit: "עַ'נֵּית", he: "שרתי", song: "ولا مرة" },
  { ar: "طال", translit: "טַאל", he: "התארך / נמשך זמן", song: "ولا مرة" },
  { ar: "وهم", translit: "וַהְם", he: "אשליה / דמיון", song: "ولا مرة" },
  { ar: "خيال", translit: "חַ'יַאל", he: "דמיון / צל", song: "ولا مرة" },
  { ar: "ساكن", translit: "סַאכֵּן", he: "גר / שוכן", song: "ولا مرة" },
  { ar: "عايش", translit: "עַאיִש", he: "חי", song: "ولا مرة" },
  { ar: "بقربي", translit: "בִּקֻרְבִּי", he: "בקרבתי / לידי", song: "ولا مرة",
    note: "chatifai: בעיר בִּאֻרְבִּי" },
  { ar: "هوانا", translit: "הַוַאנַא", he: "האהבה שלנו", song: "ولا مرة" },
  { ar: "صعب", translit: "צַעֵבּ", he: "קשה", song: "ولا مرة" },
  { ar: "المنال", translit: "אִלְמַנַאל", he: "ההשגה", song: "ولا مرة",
    note: "chatifai: צַעֵבּ אִלְמַנַאל = קשה להשגה" },
];

/**
 * Held back — chatifai's own output contradicted itself on these, and a card
 * built from a contradiction teaches the contradiction.
 */
export const HELD_INCONSISTENT = [
  "التقل — הכותרת נותנת אִתִּיקְל וההערה באותה שורה אִתִּקְל. שני ניקודים לאותה מילה.",
  "العتيق — מסומן 'זהה' עם הערה '(בעיר: אִלְעַתִיק)', כלומר הווריאנט העירוני זהה " +
    "לצורה הראשית. במילה יש ق, אז ההערה כנראה התכוונה ל-אִלְעַתִיא.",
  "أركد — מסומן 'שונה' אבל הצורה הפלסטינית שניתנה היא 'אַרְכֹּד (זהה)'. " +
    "החלופה אַאַרְכּוֹד נראית משובשת.",
  "يقلي — הטבלה נותנת יִקִלִּי וההערה מתעתקת (Yalli). שני דברים שונים.",
  "نتلاقى — מסומן 'זהה' אבל ההערה בסוף מתארת הבדל אִמַאלֵה בין לבנונית לפלסטינית " +
    "בדיוק במילה הזאת.",
  "سهرني — הניקוד שנתן, סַהַّרְנִי, מניח דגש על ה' — אות שלא מקבלת דגש בעברית.",
  "اللذاذه ו-تدبحنا — ההערות מתארות חילופי ז/ד' מצריים אבל שתיהן מסומנות 'זהה', " +
    "כך שלא ניתנה צורה פלסטינית בפועל.",
];
