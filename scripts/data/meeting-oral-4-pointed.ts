// The pointing for מפגש בעפ 4, keyed by Ariel's own spelling in
// meeting-oral-4.ts.
//
// **This file is empty on purpose.** The pointing has to come from chatifai, and
// on 2026-08-11 the Claude in Chrome extension was not connected, so the pass
// could not run. Nothing here is filled in from general Arabic knowledge — that
// is the one thing this project does not do, and it has produced fabricated
// forms before (`לַוְזִין`, `מַיַّאתִי`, `עַ-בַּלַאש` glossed wrong).
//
// The insert script refuses any entry missing from this map, so an empty file
// means nothing is written rather than something is written badly.
//
// When the extension is connected, the chatifai pass asks for nikud and Arabic
// script ONLY — never a translation, never a verdict — under the rule in
// .claude/agents/chatifai.md. Paste its output here verbatim: same characters,
// no cleanup. `normalizeMarks` in the insert script handles the one permitted
// adjustment, Arabic shadda U+0651 → Hebrew dagesh U+05BC.

export type Pointed = {
  /** Hebrew transliteration with nikud, exactly as chatifai printed it. */
  translit: string;
  /** Arabic script, exactly as chatifai printed it. */
  ar: string;
  /** Anything chatifai volunteered that was not asked for. Does not change the card. */
  chatifaiNote?: string;
};

/** keyed by the `heard` string in meeting-oral-4.ts */
// chatifai, 2026-10-20 — one pass asking for pointing and Arabic only, then a
// follow-up sending back the two it got wrong (#29 came back as עַרִים, #31 as
// מֻסְתַחִיל instead of the heard מוסתחין). Both answered on the word asked.
export const POINTED: Record<string, Pointed> = {
  "בעד שוואי / בעדין": { translit: "בַּעְד שְוַיְ / בַּעְדֵין", ar: "بعد شوي / بعدين" },
  "ברוח עלא חפלה": { translit: "בַּרוּח עַלַא חַפְלֵה", ar: "بروح على حفلة" },
  "חפלת צאחבי": { translit: "חַפְלֵת צַאחְבִּי", ar: "حفلة صاحبي" },
  "צחית": { translit: "צִחִית", ar: "صحيت" },
  "עשן": { translit: "עַשַאן", ar: "عشان" },
  "אחתיאט": { translit: "אִחְתִיַאט", ar: "احتياط" },
  "איחכולי": { translit: "אִחְכּוּלִי", ar: "احكولي" },
  "ען": { translit: "עַנּ", ar: "عن" },
  "מכאן": { translit: "מַכַּאן", ar: "مكان" },
  "בריכה": { translit: "בִּרְכֵּה", ar: "بركة" },
  "סבח, יסבח": { translit: "סַבַּח, יִסְבַּח", ar: "سبح، يسبح" },
  "בחיב אסבח": { translit: "בַּחִבּ אַסְבַּח", ar: "بحب أسبح" },
  "טברייה": { translit: "טַבַּרִיַּה", ar: "طبرية" },
  "מונתזה": { translit: "מֻנְתַזַה", ar: "منتزه" },
  "רציף": { translit: "רַצִיף", ar: "رصيف" },
  "אזא": { translit: "אִזַא", ar: "إذا" },
  "לו": { translit: "לַוְ", ar: "لو" },
  "ווא": { translit: "וַא", ar: "و" },
  "ליש": { translit: "לֵיש", ar: "ليش" },
  "ווא ליש": { translit: "וַא לֵיש", ar: "و ليش" },
  "למה": { translit: "לַמַּא", ar: "لما" },
  "בחד'ר": {
    translit: "בַּחְצַ'ר",
    ar: "بحضر",
    chatifaiNote: "ניקד בצ' (ض) — אריאל שמע ד'. במדוברת ض נהגית לרוב כמו ظ, אז זו אותה מילה",
  },
  "שטרנג'": { translit: "שַטְרַנְג'", ar: "شطرنج" },
  "מעקול": { translit: "מַעְקוּל", ar: "معقول" },
  "מוסתאחיל": { translit: "מֻסְתַחִיל", ar: "مستحيل" },
  "מש מעקול": { translit: "מֻש מַעְקוּל", ar: "مش معقول" },
  "בַּלְעַבּ": { translit: "בַּלְעַבּ", ar: "بلعب" },
  "אסוי": { translit: "אַסַוִּי", ar: "أسوي" },
  "ארוס": { translit: "עַרוּס", ar: "عروس" },
  "עריס": { translit: "עַרִיס", ar: "عريس" },
  "עורס": { translit: "עֻרְס", ar: "عرس" },
  "אווצל / אג'י": { translit: "אַוְצַל / אַאגִ'י", ar: "أوصل / آجي" },
  "מוסתחין אווצל/אג'י עלא ערס": {
    translit: "מֻסְתַחִין אַוְצַל / אַאגִ'י עַלַא עֻרְס",
    ar: "مستحين أوصل / آجي على عرس",
    chatifaiNote: "מֻסְתַחִין היא וריאציה מקומית של מֻסְתַחִיל (مستحيل)",
  },
  "מליש מסארי": { translit: "מַאלִיש מַצַארִי", ar: "ماليش مصاري" },
  "פלוס": { translit: "פֻלוּס", ar: "فلوس" },
  "אלי מעו פלוסו בנת אלסולטאן ערוסו": {
    translit: "אִלִּי מַעוֹ פֻלוּסוֹ בִּנְתִ (אל)סֻּלְטַאן עַרוּסוֹ",
    ar: "اللي معه فلوسه بنت السلطان عروسه",
  },
  "אלי ביסתחי מן בנת עמו, מא ביג'יב אוולאד": {
    translit: "אִלִּי בִּיסְתְחִי מִן בִּנְת עַמּוֹ, מַא בִּיגִ'יבּ אוֹלַאד",
    ar: "اللي بيستحي من بنت عمه، ما بيجيب أولاد",
  },
  "ביסתחי": { translit: "בִּיסְתְחִי", ar: "بيستحي" },
};

/**
 * Ariel left these two without a gloss. On 2026-10-20 he asked for chatifai to
 * supply the meaning — the one place in this lesson where chatifai is asked
 * what a word means. The card says so in course_note.
 */
export const GLOSS_FROM_CHATIFAI: Record<string, string> = {
  "צחית": "התעוררתי",
  "אווצל / אג'י": "אגיע / אבוא",
};

/**
 * Entries Ariel left without a gloss. Held out entirely — a card with no meaning
 * is not a card, and inventing one would be inventing the lesson.
 */
export const NEEDS_GLOSS_FROM_ARIEL: string[] = [];

/**
 * Already in the database under a different gloss. These do not become new
 * cards; what the lesson added is a note on the card that is already there.
 *
 * `פלוס` is the interesting one: the existing card says "כסף", and Tomer's point
 * was specifically that פלוס is *more* than מסארי — a distinction the current
 * card erases. That belongs in `course_note`, not in a duplicate card.
 */
export const EXISTING_CARDS_TO_ANNOTATE: { heard: string; courseNote: string }[] = [
  { heard: "ען", courseNote: "מפגש בעפ 4: אודות" },
  { heard: "פלוס", courseNote: "מפגש בעפ 4: הון — יותר כסף מ-מַצַארִי" },
];
