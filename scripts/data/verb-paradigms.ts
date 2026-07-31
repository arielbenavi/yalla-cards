// Palestinian Arabic verb paradigms, obtained from chatifai.io.
// Transliteration is exactly as chatifai gave it — chatifai labels this column
// "תעתיק עברי פונטי", so it is phonetic pointing, not full nikud, and it is the
// only vocalised column. Arabic cells mostly carry no harakat.
//
// Do not "fix" a form here from general Arabic knowledge. The project rule is
// that chatifai is the sole authority on vocalisation; anything doubtful goes
// back to chatifai and gets recorded in `flags` until it does.

export type Form = { translit: string; arabic: string };
export type Person = "ana" | "inta" | "inti" | "huwwe" | "hiyye" | "ihna" | "intu" | "hum";

export type Verb = {
  root: string;
  root_translit: string;
  meaning_he: string;
  /** Verb pattern / בניין, as chatifai classified it. */
  binyan?: string;
  past: Record<Person, Form>;
  present: Record<Person, Form>;
  imperative: { inta: Form; inti: Form; intu: Form };
  participle?: { m: Form; f: Form; pl: Form };
  /** Dialect variants and usage notes worth surfacing on the card. */
  notes?: string;
  /** Cells still awaiting chatifai confirmation. Non-empty ⇒ chatifai_verified stays false. */
  flags?: string[];
};

export const VERBS: Verb[] = [
  {
    root: "راح",
    root_translit: "רַאח",
    meaning_he: "הלך / ללכת",
    binyan: 'גזרת ע"ו',
    past: {
      ana: { translit: "רֻחֵת", arabic: "رحت" },
      inta: { translit: "רֻחֵת", arabic: "رحت" },
      inti: { translit: "רֻחְתִי", arabic: "رحتي" },
      huwwe: { translit: "רַאח", arabic: "راح" },
      hiyye: { translit: "רַאחַת", arabic: "راحت" },
      ihna: { translit: "רֻחְנַא", arabic: "رحنا" },
      intu: { translit: "רֻחְתוּ", arabic: "رحتوا" },
      hum: { translit: "רַאחוּ", arabic: "راحوا" },
    },
    present: {
      ana: { translit: "בַּרוּח", arabic: "بروح" },
      inta: { translit: "בִּתְרוּח", arabic: "بتروح" },
      inti: { translit: "בִּתְרוּחִי", arabic: "بتروحي" },
      huwwe: { translit: "בִּרוּח", arabic: "بيروح" },
      hiyye: { translit: "בִּתְרוּח", arabic: "بتروح" },
      ihna: { translit: "מִנְרוּח", arabic: "منروح" },
      intu: { translit: "בִּתְרוּחוּ", arabic: "بتروحوا" },
      hum: { translit: "בִּרוּחוּ", arabic: "بيروحوا" },
    },
    imperative: {
      inta: { translit: "רוּח", arabic: "روح" },
      inti: { translit: "רוּחִי", arabic: "روحي" },
      intu: { translit: "רוּחוּ", arabic: "روحوا" },
    },
    participle: {
      m: { translit: "רַאיֵח", arabic: "رايح" },
      f: { translit: "רַאיְחַה", arabic: "رايحة" },
      pl: { translit: "רַאיְחִין", arabic: "رايحين" },
    },
    notes:
      "הבינוני נפוץ יותר מההווה ל'הולך עכשיו': אַנַא רַאיֵח עַ-אלְבֵּית. רַאח משמש גם כמילית עתיד שאינה נוטה: רַאח אַרוּח. וריאנט: בכפרי/צפוני ה-u נוטה ל-o (רֹחֵת).",
  },
  {
    root: "حكى",
    root_translit: "חַכַּא",
    meaning_he: "דיבר / לדבר",
    binyan: 'גזרת ל"י',
    past: {
      ana: { translit: "חַכֵּית", arabic: "حكيت" },
      inta: { translit: "חַכֵּית", arabic: "حكيت" },
      inti: { translit: "חַכֵּיתִי", arabic: "حكيتي" },
      huwwe: { translit: "חַכַּא", arabic: "حكى" },
      hiyye: { translit: "חַכַּת", arabic: "حكت" },
      ihna: { translit: "חַכֵּינַא", arabic: "حكينا" },
      intu: { translit: "חַכֵּיתוּ", arabic: "حكيتوا" },
      hum: { translit: "חַכּוּ", arabic: "حكوا" },
    },
    present: {
      ana: { translit: "בַּחְכִּי", arabic: "بحكي" },
      inta: { translit: "בְּתִחְכִּי", arabic: "بتحكي" },
      inti: { translit: "בְּתִחְכִּי", arabic: "بتحكي" },
      huwwe: { translit: "בִּחְכִּי", arabic: "بيحكي" },
      hiyye: { translit: "בְּתִחְכִּי", arabic: "بتحكي" },
      ihna: { translit: "מְנִחְכִּי", arabic: "منحكي" },
      intu: { translit: "בְּתִחְכּוּ", arabic: "بتحكوا" },
      hum: { translit: "בִּחְכּוּ", arabic: "بيحكوا" },
    },
    imperative: {
      inta: { translit: "אִחְכִּי", arabic: "إحكي" },
      inti: { translit: "אִחְכִּי", arabic: "إحكي" },
      intu: { translit: "אִחְכּוּ", arabic: "إحكوا" },
    },
    participle: {
      m: { translit: "חַאכִּי", arabic: "حاكي" },
      f: { translit: "חַאכְּיֵה", arabic: "حاكية" },
      pl: { translit: "חַאכְּיִין", arabic: "حاكيين" },
    },
    notes:
      'אנת ואנתי זהים בהווה ובציווי — chatifai אישר שזה אמיתי ולא שגיאה: השורש כבר נגמר ב-י, ואי אפשר להגות שתי תנועות i ארוכות ברצף, אז סיומת הנקבה נבלעת. ההבחנה היא לפי ההקשר בלבד. בעבר כן יש הבדל: חַכֵּיתִי מול חַכֵּית.',
  },
  {
    root: "أخذ",
    root_translit: "אַחַ׳ד׳",
    meaning_he: "לקח / לקחת",
    binyan: "פ' הפועל همزة",
    past: {
      ana: { translit: "אַחַ׳דֵ׳ת", arabic: "أخذت" },
      inta: { translit: "אַחַ׳דֵ׳ת", arabic: "أخذت" },
      inti: { translit: "אַחַ׳דְ׳תִי", arabic: "أخذتي" },
      huwwe: { translit: "אַחַ׳דַ׳", arabic: "أخذ" },
      hiyye: { translit: "אַחַ׳דַ׳ת", arabic: "أخذت" },
      ihna: { translit: "אַחַ׳דְ׳נַא", arabic: "أخذنا" },
      intu: { translit: "אַחַ׳דְ׳תוּ", arabic: "أخذتوا" },
      hum: { translit: "אַחַ׳ד׳וּ", arabic: "أخذوا" },
    },
    present: {
      ana: { translit: "בּוֹחֻ׳ד׳", arabic: "بوخد" },
      inta: { translit: "בִּתּוֹחֻ׳ד׳", arabic: "بتوخد" },
      inti: { translit: "בִּתּוֹחְ׳דִ׳י", arabic: "بتوخدي" },
      huwwe: { translit: "בּוֹחֻ׳ד׳", arabic: "بوخد" },
      hiyye: { translit: "בִּתּוֹחֻ׳ד׳", arabic: "بتوخد" },
      ihna: { translit: "מִנּוֹחֻ׳ד׳", arabic: "منوخد" },
      intu: { translit: "בִּתּוֹחְ׳ד׳וּ", arabic: "بتوخدوا" },
      hum: { translit: "בּוֹחְ׳ד׳וּ", arabic: "بوخدوا" },
    },
    imperative: {
      inta: { translit: "חֻ׳ד׳", arabic: "خذ" },
      inti: { translit: "חֻ׳דִ׳י", arabic: "خذي" },
      intu: { translit: "חֻ׳ד׳וּ", arabic: "خذوا" },
    },
    notes:
      "ذ נהגית בעירונית כ-ד או ז רגילה, אז ברחוב שומעים בּוֹחֹד / חֻ׳ד. הבינוני אַחִ׳ד׳ (آخذ) כמעט לא בשימוש — במקומו ההווה. ביטוי: חֻ׳ד׳ בַּאלַכּ! = שים לב / היזהר.",
  },
  {
    root: "رجع",
    root_translit: "רִגִ׳ע",
    meaning_he: "חזר / לחזור",
    binyan: "משקל פִעֵל",
    past: {
      ana: { translit: "רְגִ׳עֵת", arabic: "رجعت" },
      inta: { translit: "רְגִ׳עֵת", arabic: "رجعت" },
      inti: { translit: "רְגִ׳עְתִי", arabic: "رجعتي" },
      huwwe: { translit: "רִגִ׳ע", arabic: "رجع" },
      hiyye: { translit: "רִגִ׳עַת", arabic: "رجعت" },
      ihna: { translit: "רְגִ׳עְנַא", arabic: "رجعنا" },
      intu: { translit: "רְגִ׳עְתוּ", arabic: "رجعتوا" },
      hum: { translit: "רִגִ׳עוּ", arabic: "رجعوا" },
    },
    present: {
      ana: { translit: "בַּרְגַ׳ע", arabic: "برجع" },
      inta: { translit: "בְּתִרְגַ׳ע", arabic: "بترجع" },
      inti: { translit: "בְּתִרְגְ׳עִי", arabic: "بترجعي" },
      huwwe: { translit: "בִּרְגַ׳ע", arabic: "بيرجع" },
      hiyye: { translit: "בְּתִרְגַ׳ע", arabic: "بترجع" },
      ihna: { translit: "מִנְרְגַ׳ע", arabic: "منرجع" },
      intu: { translit: "בְּתִרְגְ׳עוּ", arabic: "بترجعوا" },
      hum: { translit: "בִּרְגְ׳עוּ", arabic: "بيرجعوا" },
    },
    imperative: {
      inta: { translit: "אִרְגַ׳ע", arabic: "إرجع" },
      inti: { translit: "אִרְגְ׳עִי", arabic: "إرجعي" },
      intu: { translit: "אִרְגְ׳עוּ", arabic: "إرجعوا" },
    },
    participle: {
      m: { translit: "רַאגֵ׳ע", arabic: "راجع" },
      f: { translit: "רַאגְ׳עַה", arabic: "راجعة" },
      pl: { translit: "רַאגְ׳עִין", arabic: "راجعين" },
    },
    notes:
      "הבינוני נפוץ מאוד להווה מתמשך (אני בדרך חזרה עכשיו). נוטה לקחת ל-: בַּרְגַ׳ע-לַכּ. וריאנט: לפעמים רִגְ׳עַת / רִגְ׳עוּ עם שווא ב-ג׳, תלוי במהירות הדיבור ובתת-הלהג.",
  },
  {
    root: "شاف",
    root_translit: "שַאף",
    meaning_he: "ראה / לראות",
    binyan: 'גזרת ע"ו',
    past: {
      ana: { translit: "שֻפֵת", arabic: "شفت" },
      inta: { translit: "שֻפֵת", arabic: "شفت" },
      inti: { translit: "שֻפְתִי", arabic: "شفتي" },
      huwwe: { translit: "שַאף", arabic: "شاف" },
      hiyye: { translit: "שַאפַת", arabic: "شافت" },
      ihna: { translit: "שֻפְנַא", arabic: "شفنا" },
      intu: { translit: "שֻפְתוּ", arabic: "شفتوا" },
      hum: { translit: "שַאפוּ", arabic: "شافوا" },
    },
    present: {
      ana: { translit: "בַּשוּף", arabic: "بشوف" },
      inta: { translit: "בִּתְשוּף", arabic: "بتشوف" },
      inti: { translit: "בִּתְשוּפִי", arabic: "بتشوفي" },
      huwwe: { translit: "בִּשוּף", arabic: "بيشوف" },
      hiyye: { translit: "בִּתְשוּף", arabic: "بتشوف" },
      ihna: { translit: "מִנְשוּף", arabic: "منشوف" },
      intu: { translit: "בִּתְשוּפוּ", arabic: "بتشوفوا" },
      hum: { translit: "בִּשוּפוּ", arabic: "بيشوفوا" },
    },
    imperative: {
      inta: { translit: "שוּף", arabic: "شوف" },
      inti: { translit: "שוּפִי", arabic: "شوفي" },
      intu: { translit: "שוּפוּ", arabic: "شوفوا" },
    },
    participle: {
      m: { translit: "שַאיֵף", arabic: "شايف" },
      f: { translit: "שַאיְפֵה", arabic: "شايفة" },
      pl: { translit: "שַאיְפִין", arabic: "شايفين" },
    },
    notes:
      "בפעלי תחושה הבינוני מתאר את הרגע הזה: אַנַא שַאיְפַכּ! מול אַנַא בַּשוּף שהוא הרגלי/עתידי. שלילה: מַא שֻפְתֵש. וריאנט: שֹפֵת בחלק מהלהגים.",
  },
  {
    root: "حبّ",
    root_translit: "חַבּ",
    meaning_he: "אהב / לאהוב",
    binyan: "גזרת הכפולים",
    past: {
      ana: { translit: "חַבֵּית", arabic: "حبيت" },
      inta: { translit: "חַבֵּית", arabic: "حبيت" },
      inti: { translit: "חַבֵּיתִי", arabic: "حبيتي" },
      huwwe: { translit: "חַבּ", arabic: "حب" },
      hiyye: { translit: "חַבַּת", arabic: "حبت" },
      ihna: { translit: "חַבֵּינַא", arabic: "حبينا" },
      intu: { translit: "חַבֵּיתוּ", arabic: "حبيتوا" },
      hum: { translit: "חַבַּוּ", arabic: "حبوا" },
    },
    present: {
      ana: { translit: "בַּחֻבּ", arabic: "بحب" },
      inta: { translit: "בִּתְחֻבּ", arabic: "بتحب" },
      inti: { translit: "בִּתְחֻבִּי", arabic: "بتحبي" },
      huwwe: { translit: "בִּחֻבּ", arabic: "بيحب" },
      hiyye: { translit: "בִּתְחֻבּ", arabic: "بتحب" },
      ihna: { translit: "מִנְחֻבּ", arabic: "منحب" },
      intu: { translit: "בִּתְחֻבּוּ", arabic: "بتحبوا" },
      hum: { translit: "בִּחֻבּוּ", arabic: "بيحبوا" },
    },
    imperative: {
      inta: { translit: "חִבּ", arabic: "حب" },
      inti: { translit: "חִבִּי", arabic: "حبي" },
      intu: { translit: "חִבּוּ", arabic: "حبوا" },
    },
    participle: {
      m: { translit: "חַאבֵּבּ", arabic: "حابب" },
      f: { translit: "חַאבֵּה", arabic: "حابة" },
      pl: { translit: "חַאבִּין", arabic: "حابين" },
    },
    notes:
      "בַּחֻבּ = אהבה כללית/הרגלית; חַאבֵּבּ = רצון רגעי (חַאבֵּבּ אַרוּח עַ-אלְבַּחַר). בינוני פעול: מַחְבּוּבּ / מַחְבּוּבֵּה / מַחְבּוּבִּין. וריאנט כפרי: בַּחִבּ במקום בַּחֻבּ.",
    flags: ["past.hum — chatifai gave חַבַּוּ; pending confirmation that it is not חַבּוּ"],
  },
  {
    root: "أكل",
    root_translit: "אַכַּל",
    meaning_he: "אכל / לאכול",
    binyan: "פ' הפועל همزة, משקל פַעַל",
    past: {
      ana: { translit: "אַכַּלֵת", arabic: "أكلت" },
      inta: { translit: "אַכַּלֵת", arabic: "أكلت" },
      inti: { translit: "אַכַּלְתִי", arabic: "أكلتي" },
      huwwe: { translit: "אַכַּל", arabic: "أكل" },
      hiyye: { translit: "אַכַּלַת", arabic: "أكلت" },
      ihna: { translit: "אַכַּלְנַא", arabic: "أكلنا" },
      intu: { translit: "אַכַּלְתוּ", arabic: "أكلتوا" },
      hum: { translit: "אַכַּלוּ", arabic: "أكلوا" },
    },
    present: {
      ana: { translit: "בּוֹכֵּל", arabic: "بوكل" },
      inta: { translit: "בִּתּוֹכֵּל", arabic: "بتوكل" },
      inti: { translit: "בִּתּוֹכְּלִי", arabic: "بتوكلي" },
      huwwe: { translit: "בּוֹכֵּל", arabic: "بوكل" },
      hiyye: { translit: "בִּתּוֹכֵּל", arabic: "بتوكل" },
      ihna: { translit: "מִנּוֹכֵּל", arabic: "منوكل" },
      intu: { translit: "בִּתּוֹכְּלוּ", arabic: "بتوكلوا" },
      hum: { translit: "בּוֹכְּלוּ", arabic: "بوكلوا" },
    },
    imperative: {
      inta: { translit: "כּוּל", arabic: "كول" },
      inti: { translit: "כּוּלִי", arabic: "كولي" },
      intu: { translit: "כּוּלוּ", arabic: "كولوا" },
    },
    participle: {
      m: { translit: "אַאכֵּל", arabic: "آكل" },
      f: { translit: "אַאכְּלֵה", arabic: "آكلة" },
      pl: { translit: "אַאכְּלִין", arabic: "آكلين" },
    },
    notes:
      "הבינוני מציין מצב של כבר-אכלתי: אַנַא אַאכֵּל. וריאנטים: בצפון בּוֹכֻּל במקום בּוֹכֵּל; בכפרי ك הופכת צ׳ — בּוֹצֵ׳ל.",
  },
  {
    root: "طلع",
    root_translit: "טִלֵע",
    meaning_he: "יצא, עלה / לצאת",
    binyan: "משקל פִעֵל",
    past: {
      ana: { translit: "טְלִעֵת", arabic: "طلعت" },
      inta: { translit: "טְלִעֵת", arabic: "طلعت" },
      inti: { translit: "טְלִעְתִי", arabic: "طلعتي" },
      huwwe: { translit: "טִלֵע", arabic: "طلع" },
      hiyye: { translit: "טִלְעַת", arabic: "طلعت" },
      ihna: { translit: "טְלִעְנַא", arabic: "طلعنا" },
      intu: { translit: "טְלִעְתוּ", arabic: "طلعتوا" },
      hum: { translit: "טִלְעוּ", arabic: "طلعوا" },
    },
    present: {
      ana: { translit: "בַּטְלַע", arabic: "بطلع" },
      inta: { translit: "בִּתְטְלַע", arabic: "بتطلع" },
      inti: { translit: "בִּתְטְלְעִי", arabic: "بتطلعي" },
      huwwe: { translit: "בִּטְלַע", arabic: "بيطلع" },
      hiyye: { translit: "בִּתְטְלַע", arabic: "بتطلع" },
      ihna: { translit: "מִנְטְלַע", arabic: "منطلع" },
      intu: { translit: "בִּתְטְלְעוּ", arabic: "بتطلعوا" },
      hum: { translit: "בִּטְלְעוּ", arabic: "بيطلعوا" },
    },
    imperative: {
      inta: { translit: "אִטְלַע", arabic: "إطلع" },
      inti: { translit: "אִטְלְעִי", arabic: "إطلعي" },
      intu: { translit: "אִטְלְעוּ", arabic: "إطلعوا" },
    },
    participle: {
      m: { translit: "טַאלֵע", arabic: "طالع" },
      f: { translit: "טַאלְעַה", arabic: "طالعة" },
      pl: { translit: "טַאלְעִין", arabic: "طالعين" },
    },
    notes:
      "הבינוני = פעולה ברגע זה (אַבּוּי טַאלֵע). משמעויות נוספות: עלה (טְלִעֵת עַ-אלְגַ׳בַּל), עלה על רכב (טְלִעֵת פִי אלְבַּאץ), יצא ש... (טִלֵע אִנּוֹ). וריאנט: אֻטְלַע בציווי בגלל ה-ט׳ הנחצית.",
  },
  {
    root: "عطى",
    root_translit: "עַטַא",
    meaning_he: "נתן / לתת",
    binyan: 'גזרת ל"י',
    past: {
      ana: { translit: "עַטֵית", arabic: "عطيت" },
      inta: { translit: "עַטֵית", arabic: "عطيت" },
      inti: { translit: "עַטֵיתִי", arabic: "عطيتي" },
      huwwe: { translit: "עַטַא", arabic: "عطى" },
      hiyye: { translit: "עַטַת", arabic: "عطت" },
      ihna: { translit: "עַטֵינַא", arabic: "عطينا" },
      intu: { translit: "עַטֵיתוּ", arabic: "عطيتوا" },
      hum: { translit: "עַטּוּ", arabic: "عطوا" },
    },
    present: {
      ana: { translit: "בַּעְטִי", arabic: "بعطي" },
      inta: { translit: "בִּתְעְטִי", arabic: "بتعطي" },
      inti: { translit: "בִּתְעְטִי", arabic: "بتعطي" },
      huwwe: { translit: "בִּיעְטִי", arabic: "بيعطي" },
      hiyye: { translit: "בִּתְעְטִי", arabic: "بتعطي" },
      ihna: { translit: "מִנְעְטִי", arabic: "منعطي" },
      intu: { translit: "בִּתְעְטוּ", arabic: "بتعطوا" },
      hum: { translit: "בִּיעְטוּ", arabic: "بيعطوا" },
    },
    imperative: {
      inta: { translit: "אִעְטִי", arabic: "إعطي" },
      inti: { translit: "אִעְטִי", arabic: "إعطي" },
      intu: { translit: "אִעְטוּ", arabic: "إعطوا" },
    },
    participle: {
      m: { translit: "עַאטִי", arabic: "عاطي" },
      f: { translit: "עַאטְיֵה", arabic: "عاطية" },
      pl: { translit: "עַאטְיִין", arabic: "عاطيين" },
    },
    notes:
      'כמו חַכַּא — אנת ואנתי זהים בהווה ובציווי, ההבדל בהקשר בלבד (גזרת ל"י). ברחוב כמעט תמיד משמיטים את ה-א׳ בציווי: עְטִינִי (תן לי), עְטִיה (תן לו). וריאנט: אַעְטֵית בחלק מהלהגים, אבל עַטֵית שלטת ברוב פלסטין.',
    flags: ["past.hum — chatifai gave עַטּוּ; pending confirmation that it is not עַטוּ"],
  },
  {
    root: "فهم",
    root_translit: "פִהֵם",
    meaning_he: "הבין / להבין",
    binyan: "משקל פִעֵל",
    past: {
      ana: { translit: "פְהִמֵת", arabic: "فهمت" },
      inta: { translit: "פְהִמֵת", arabic: "فهمت" },
      inti: { translit: "פְהִמְתִי", arabic: "فهمتي" },
      huwwe: { translit: "פִהֵם", arabic: "فهم" },
      hiyye: { translit: "פִהְמַת", arabic: "فهمت" },
      ihna: { translit: "פְהִמְנַא", arabic: "فهمنا" },
      intu: { translit: "פְהִמְתוּ", arabic: "فهمتوا" },
      hum: { translit: "פִהְמוּ", arabic: "فهموا" },
    },
    present: {
      ana: { translit: "בַּפְהַם", arabic: "بفهم" },
      inta: { translit: "בְּתִפְהַם", arabic: "بتفهم" },
      inti: { translit: "בְּתִפְהַמִי", arabic: "بتفهمي" },
      huwwe: { translit: "בִּפְהַם", arabic: "بيفهم" },
      hiyye: { translit: "בְּתִפְהַם", arabic: "بتفهم" },
      ihna: { translit: "מִנְפְהַם", arabic: "منفهم" },
      intu: { translit: "בְּתִפְהַמוּ", arabic: "بتفهموا" },
      hum: { translit: "בִּפְהַמוּ", arabic: "بيفهموا" },
    },
    imperative: {
      inta: { translit: "אִפְהַם", arabic: "إفهم" },
      inti: { translit: "אִפְהַמִי", arabic: "إفهمي" },
      intu: { translit: "אִפְהַמוּ", arabic: "إفهموا" },
    },
    participle: {
      m: { translit: "פַאהֵם", arabic: "فاهم" },
      f: { translit: "פַאהְמֵה", arabic: "فاهمة" },
      pl: { translit: "פַאהְמִין", arabic: "فاهمين" },
    },
    notes:
      "ל'אני מבין אותך' משתמשים בבינוני פַאהֵם ולא ב-בַּפְהַם. המושא נקשר ב-עַלַא: פַאהֵם עַלֵיכּ, מַא פְהִמְתֵש עַלֵיהַא.",
  },
];
