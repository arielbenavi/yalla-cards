// chatifai's confirmations of the מפגש בעפ 3 lesson forms.
//
// Empty until chatifai is reachable — it was logged out when this batch was
// prepared. The file exists now so the insert path is finished and reviewed
// before the rulings arrive, rather than being written in a hurry around them.
//
// **How to fill this in.** For each entry, `translit` and `ar` are what chatifai
// printed for the form Tomer said. `chatifai_agrees` records whether it accepted
// that form:
//
//   - agrees, or differs only in a vowel / dagesh / tā marbūṭa
//       → keep the lesson form, `chatifai_agrees: true`
//   - differs drastically (different word, different root, meaning does not match)
//       → use chatifai's form, `chatifai_agrees: false`, and say so to Ariel
//   - differs somewhere in between
//       → keep the lesson form, `chatifai_agrees: false`, and put what it said in
//         `chatifai_said` so the disagreement survives
//
// Never silently replace a lesson form. See .claude/skills/tasks/SKILL.md.

export type Ruled = {
  /** Ariel's by-ear spelling, carried through so the card traces back to it. */
  heard: string;
  /** chatifai's pointed transliteration of the lesson form. */
  translit: string;
  ar: string;
  he: string;
  /** True only if chatifai accepted the form said in the lesson. */
  chatifai_agrees?: boolean;
  /** What chatifai said when it did not agree. Verbatim. */
  chatifai_said?: string;
  /** Ariel wrote (מאומת תומר) beside it. */
  tomer?: boolean;
  /** Ariel's own note from the lesson. */
  ariel_note?: string;
  /** Extra usage note worth keeping on the card. */
  note?: string;
  item_type?: "word" | "phrase" | "sentence";
};

export const RULED: Ruled[] = [
  // ── קבוצה 1 ──
  { heard: "אעדי", translit: "עַאדִי", ar: "عادي", he: "רגיל", chatifai_agrees: true,
    note: "תשובה לשאלה שו אחבאראכ" },
  { heard: "מועיין", translit: "מֻעַיַן", ar: "معين", he: "מסוים", chatifai_agrees: true },
  { heard: "אואל אישי", translit: "אַוַל אִשִי", ar: "أول إشي", he: "דבר ראשון",
    chatifai_agrees: true, note: "chatifai: ביטוי רחוב קלאסי לפתיחת משפט", item_type: "phrase" },
  { heard: "אילי בידנא נעמלו", translit: "אִלִי בִּדְנַא נִעְמַלוֹ", ar: "إللي بدنا نعمله",
    he: "מה שאנחנו רוצים לעשות", chatifai_agrees: true, item_type: "phrase" },
  { heard: "כול וואחאד", translit: "כֻּל וַאחַד", ar: "كل واحد", he: "כל אחד", chatifai_agrees: true },
  { heard: "לזם יוכתוב", translit: "לַאזֵם יֻכְּתֹבּ", ar: "لازم يكتب", he: "צריך לכתוב",
    chatifai_agrees: true, note: "chatifai: לַאזֵם משמש כ'צריך' לכל הגופים", item_type: "phrase" },
  { heard: "לזם נערף", translit: "לַאזֵם נִעְרֵף", ar: "لازم نعرف", he: "צריכים לדעת",
    chatifai_agrees: true, item_type: "phrase" },
  { heard: "ג'ומלה", translit: "גֻ'מְלֵה", ar: "جملة", he: "משפט", chatifai_agrees: true },
  { heard: "ג'מלתין", translit: "גֻ'מְלַתֵין", ar: "جملتين", he: "שני משפטים",
    chatifai_agrees: true, note: "chatifai: סיומת ֵין מציינת זוג" },
  { heard: "נעמל", translit: "נִעְמַל", ar: "نعمل", he: "נעשה", chatifai_agrees: true },
  { heard: "נעמלו", translit: "נִעְמַלוֹ", ar: "نعمله", he: "נעשה אותו", chatifai_agrees: true,
    note: "chatifai: ה-ו' בסוף היא המושא 'אותו'" },
  { heard: "כזב", translit: "כִּזֵבּ", ar: "كذب", he: "שקר", chatifai_agrees: true,
    note: "chatifai: ה-ذ הופכת ל-ז' או ד' בפלסטינית" },
  { heard: "מבלעש", translit: "מִנְבַּלֵש", ar: "منبلش", he: "נתחיל", chatifai_agrees: true,
    note: "chatifai: 'בלש' זה להתחיל בלהג" },
  { heard: "חודו", translit: "חֻ'דוּ", ar: "خذوا", he: "קחו", chatifai_agrees: true,
    note: "chatifai: ציווי לרבים" },
  { heard: "אַנַא גַ\'אהֵז", translit: "אַנַא גַ\'אהֵז", ar: "أنا جاهز", he: "אני מוכן (ז)",
    chatifai_agrees: true, item_type: "phrase" },
  { heard: "אַנַא גַ\'אהְזֵה", translit: "אַנַא גַ\'אהְזֵה", ar: "أنا جاهزة", he: "אני מוכנה (נ)",
    chatifai_agrees: true, item_type: "phrase" },
  { heard: "כוליל באקיה", translit: "כֻּלִ (א)לְבַּאקִיֵה", ar: "كل الباقية", he: "כל השאר",
    chatifai_agrees: true, item_type: "phrase" },
  { heard: "תרג'ם", translit: "תַרְגֵ\'ם", ar: "ترجم", he: "תרגם", chatifai_agrees: true,
    tomer: true, note: "chatifai: ציווי לזכר" },

  // ── קבוצה 2 ──
  { heard: "עיסה / עסה", translit: "אִסַא", ar: "إسا", he: "עכשיו", chatifai_agrees: true,
    note: "chatifai: להג צפוני/גלילי. ה-ע' שנשמעה היא א' גרונית" },
  { heard: "אציר", translit: "אַצִיר", ar: "أصير", he: "אהיה / אהפוך ל...", chatifai_agrees: true,
    note: "הומופון: יש מילה נוספת בהגייה זהה — قصير = קצר. " +
      "chatifai: אַכּוּן נקייה יותר ל'להיות', אַצִיר נושאת משמעות של תהליך ושינוי" },
  { heard: "אכון", translit: "אַכּוּן", ar: "أكون", he: "אהיה", chatifai_agrees: true,
    note: "chatifai: העתיד של כַּאן. ברירת המחדל ל'אהיה'" },
  { heard: "אעטל", translit: "עַאטֵל", ar: "عاطل", he: "מובטל", chatifai_agrees: true, tomer: true,
    note: "chatifai: עַאטֵל עַן אֵלְעַמַל" },
  { heard: "הונאכ", translit: "הֻנַאכּ", ar: "هناك", he: "שם", chatifai_agrees: true },
  { heard: "ע'אד", translit: "עַ\'אד", ar: "غاد", he: "שם", chatifai_agrees: true,
    note: "אריאל מתומר: יותר פלסטיני מ-הֻנַאכּ. chatifai: כפרית/בדואית אותנטית" },
  { heard: "מוסתוא", translit: "מֻסְתַוַא", ar: "مستوى", he: "רמה", chatifai_agrees: true },
  { heard: "מוסתוא אעלי", translit: "מֻסְתַוַא אַעְלַא", ar: "مستوى أعلى", he: "רמה גבוהה יותר",
    chatifai_agrees: true, item_type: "phrase" },
  { heard: "אנא אומפאקר", translit: "אַנַא מְפַכֵּר", ar: "أنا مفكر", he: "אני חושב / מתכנן",
    chatifai_agrees: true, note: "chatifai: בינוני" },
  { heard: "אנא בפאכר", translit: "אַנַא בַּפַכֵּר", ar: "أنا بفكر", he: "אני חושב",
    chatifai_agrees: true, note: "chatifai: הווה" },
  { heard: "חכינה", translit: "חַכֵּינַא", ar: "حكينا", he: "דיברנו", chatifai_agrees: true },
  { heard: "אשתריית", translit: "אִשְתַרֵית", ar: "اشتريت", he: "קניתי", chatifai_agrees: true },
  { heard: "סכראן", translit: "סַכְּרַאן", ar: "سكران", he: "שיכור", chatifai_agrees: true },
  { heard: "פכרני סכראן", translit: "פַכַּרְנִי סַכְּרַאן", ar: "فكرني سكران",
    he: "הוא חשב אותי שיכור", chatifai_agrees: true, item_type: "phrase" },
  { heard: "עשרים ולד", translit: "עִשְרִין וַלַד", ar: "عشرين ولد", he: "עשרים ילד",
    chatifai_agrees: true, note: "chatifai: אחרי 11-99 שם העצם ביחיד", item_type: "phrase" },
  { heard: "עישרין תאניה", translit: "עִשְרִין תַאנְיֵה", ar: "عشرين ثانية", he: "20 שניות",
    chatifai_agrees: true, item_type: "phrase" },

  // ── ארבע שורות שבהן chatifai כתב "מאשר" וההערה שלו סתרה את האישור ──
  // בכולן לקחתי את הצורה שלו, כי במקרים האלה אריאל תמלל באוזן מילה שלא קיימת,
  // וזה תיקון של שמיעה ולא החלפה של מה שנאמר בשיעור.
  { heard: "פכס אלכוחול", translit: "פַחְצ אִלְכֻּחוּל", ar: "فحص الكحول", he: "בדיקת אלכוהול",
    chatifai_agrees: false, item_type: "phrase",
    chatifai_said: "'שמעת פכס במקום פחצ' — فحص היא 'בדיקה'. פכס אינה מילה" },
  { heard: "בחליףכום", translit: "בַּחְלִפְלְכֻּם", ar: "بحلفلكم", he: "נשבע לכם",
    chatifai_agrees: false,
    chatifai_said: "מילולית 'אני נשבע לכם', לא 'מבטיח'. הצורה כוללת ל- נוספת" },
  { heard: "צאפארת", translit: "סַאפַרְת", ar: "سافرت", he: "נסעתי / טיילתי",
    chatifai_agrees: false,
    chatifai_said: "سافرت הוא 'נסעתי/טיילתי', לא 'נהגתי'. לנהיגה — سقت. " +
      "אריאל רשם 'נהגתי'; ההקשר בשיעור היה נהיגה, אז שווה לוודא מול תומר" },
];
