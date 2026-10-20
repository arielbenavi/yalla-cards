// The pointing for the unpointed part of מפגש בעפ 5, keyed by Ariel's own
// spelling in meeting-oral-5.ts.
//
// chatifai, 2026-10-20: one pass for pointing and Arabic only (77 items), then
// a second pass sending back the 14 where it pointed a different word than the
// one Ariel heard. The second pass is where it starts inventing — asked to
// point "מח'יים אלעג'ין" exactly as heard it produced مخيم العجين, "camp of the
// dough". So an insisted answer is taken only where it is still a real word
// with the meaning Ariel wrote down; the rest are in HELD below, for him.

export type Pointed = { translit: string; ar: string; chatifaiNote?: string; he?: string };

export const POINTED: Record<string, Pointed> = {
  "פאת": { translit: "פַאת", ar: "فات" },
  "דחל": { translit: "דַחַ'ל", ar: "دخل" },
  "מדחל": { translit: "מַדְחַ'ל", ar: "مدخل" },
  "איכאן": { translit: "אִכַּאן", ar: "إكان" },
  "איכון": { translit: "אִכּוּן", ar: "إكون" },
  "כאן": { translit: "כַּאן", ar: "كان" },
  "כאנאת": { translit: "כַּאנַת", ar: "كانت" },
  "כונת": { translit: "כֻּנְת", ar: "كنت" },
  "אכתר": { translit: "אַכְּתַר", ar: "أكثر" },
  "כילמה": { translit: "כִּלְמֵה", ar: "كلمة" },
  "כילמה ג'דידה": { translit: "כִּלְמֵה גְ'דִידֵה", ar: "كلمة جديدة" },
  "בורג'": { translit: "בֻּרְג'", ar: "برج" },
  "פרחאן": { translit: "פַרְחַאן", ar: "فرحان" },
  "בסוהולה": { translit: "בִּסֻהוּלֵה", ar: "بسهولة" },
  "עלא פיכרה": { translit: "עַלַא פִכְּרַה", ar: "على فكرة" },
  "מערוף": { translit: "מַעְרוּף", ar: "معروف" },
  "ביסמו": { translit: "בִּסְמוֹ", ar: "باسمه" },
  "כיף": { translit: "כֵּיף", ar: "كيف" },
  "טאטע": { translit: "טַאטַע", ar: "طاطا" },
  "מרד": { translit: "מַרַד'", ar: "مرض" },
  "מאריד": { translit: "מַרִיד'", ar: "مريض" },
  "תמרד' / יתמרד'": { translit: "תְמַארַד' / יִתְמַארַד'", ar: "تمارض / يتمارض" },
  "עיאדה": { translit: "עִיַאדֵה", ar: "عيادة" },
  "מוח'יים": { translit: "מֻחַ'יַּם", ar: "مخيم" },
  "ח'ימה": { translit: "חֵ'ימֵה", ar: "خيمة" },
  "מקוומה": { translit: "מֻקַאוַמֵה", ar: "مقاومة" },
  "איסתיכלאל": { translit: "אִסְתִכְּלַאל", ar: "استقلال" },
  "חאראכת סייאראת": { translit: "חַרַכַּת סַיַּארַאת", ar: "حركة سيارات" },
  "למא": { translit: "לַמַּא", ar: "لما" },
  "ח'וד ע-ימין": { translit: "חֻ'וד עַ-יַמִין", ar: "خذ ع اليمين" },
  "ח'וד ע-שמאל": { translit: "חֻ'וד עַ-שְמַאל", ar: "خذ ع الشمال" },
  "אמשי": { translit: "אִמְשִי", ar: "امشي" },
  "אמשי דע'רי": { translit: "אִמְשִי דֻעְ'רִי", ar: "امشي دغري" },
  "לחד מא": { translit: "לַחַדּ מַא", ar: "لحد ما" },
  "למא תשוף": { translit: "לַמַּא תְשוּף", ar: "لما تشوف" },
  "אטלע": { translit: "אִטְלַע", ar: "اطلع" },
  "אנזל": { translit: "אִנְזַל", ar: "انزل" },
  "אדח'ול": { translit: "אֻדְחֻ'ל", ar: "ادخل" },
  "חוש": { translit: "חוּש", ar: "حوش" },
  "פות": { translit: "פוּת", ar: "فوت" },
  "לף": { translit: "לִף", ar: "لف" },
  "מפרק": { translit: "מַפְרַק", ar: "مفرق" },
  "רציף": { translit: "רַצִיף", ar: "رصيف" },
  "ויצל": { translit: "וִצִל", ar: "وصل" },
  "לחד מא תוצל ע רמזון": { translit: "לַחַדּ מַא תּוּצַל עַ-רַמְזוֹן", ar: "لحد ما توصل ع رمظون" },
  "לחד רמזון": { translit: "לַחַדּ רַמְזוֹן", ar: "لحد رمظون" },
  "זעפולו": { translit: "זַעְפוּלוֹ", ar: "زقفوا له" },
  "זעף / יוזעוף": { translit: "זַעַף / יוּזְעֻוף", ar: "زقف / يزقف" },
  "לזם": { translit: "לַאזִם", ar: "لازم" },
  "אינת לאזם תשוף": { translit: "אִנְתֵ לַאזִם תְשוּף", ar: "انت لازم تشوف" },
  "עבוס אעינכ": { translit: "אַבּוּס עֵינַכּ", ar: "أبوس عينك" },
  "טיז'י": { translit: "תִיגִ'י", ar: "تيجي" },
  "בידכ רוחי": { translit: "בִּדַּכּ רוּחִי", ar: "بدك روحي" },
  "אינתו יתקררו": { translit: "אִנְתּוּ יִתְקַרְּרוּ", ar: "انتو يتقرروا" },
  "חטיב": { translit: "חַ'טִיבּ", ar: "خطيب" },
  "חטיבה": { translit: "חַ'טִיבֵּה", ar: "خطيبة" },
  "חטיבתו": { translit: "חַ'טִיבְּתוֹ", ar: "خطيبته" },
  "בתפה": { translit: "בִּדְפַע", ar: "بدفع" },
  "דפה": { translit: "דַפַע", ar: "دفع" },
  "עזאם": { translit: "עַזַם", ar: "عزم" },
  "חכה": { translit: "חַכַּא", ar: "حكى" },
  // Ariel's own note on this one: "זה חכתלו בתכלס, מעוותים את זה לחכתילו". The
  // first pass pointed exactly that; the insisted second pass gave חַכֵּיתִילוֹ,
  // which is "you (f.) told him" — a different meaning from his "אמרה לו".
  "חכתילו": { translit: "חַכַּתְלוֹ", ar: "حكت له" },
  "חכיתילכ": { translit: "חַכֵּיתִילַכּ", ar: "حكيتيلك" },
  "שארת": { translit: "שַרְט", ar: "شرط" },
  "באס ב שארת": { translit: "בַּס בִּ-שַרְט", ar: "بس بشرط" },
  // Ariel wrote this one the other way round — Hebrew in `heard`, the Arabic
  // word in the gloss — so the card is the Arabic word with "שפם" as meaning.
  "שפם": { translit: "שַוַארֵבּ", ar: "شوارب", he: "שפם" },
  "ליח'יה": { translit: "לִחְיֵה", ar: "لحية" },
  "עללהא": { translit: "עַאלְלְהַא", ar: "قال لها" },
  "ווז'": { translit: "וֻוז'", ar: "وجه" },
  "עיב": { translit: "עֵיבּ", ar: "عيب" },
  "מיש עיב": { translit: "מֻש עֵיבּ", ar: "مش عيب" },
  "זיי מא בידק": { translit: "זַיּ מַא בִּדַּכּ", ar: "زي ما بدك" },

  // The three with a query on them, settled against the lesson's own material:
  // the pointed directions paragraph has מִנְ בֵּיתַכּ, and the video has
  // وفي بوجهي شوارب. Where the teacher's text exists, it wins.
  "למא תטלע מן ביתי": {
    translit: "לַמַא תִטְלַע מִנְ בֵּיתַכּ",
    ar: "لما تطلع من بيتك",
    he: "כשתצא מהבית שלך",
    chatifaiNote: "לפי פסקת ההכוונה המנוקדת של השיעור (מִנְ בֵּיתַכּ) — ברשימות נכתב ביתי",
  },
  "ווז' היא ליח'יה": {
    translit: "וַפִי בִּוֻוזְ'הִי שַוַארֵבּ",
    ar: "وفي بوجهي شوارب",
    he: "ובפנים שלי יש שפם",
    chatifaiNote: "לפי הסרטון — ברשימות נכתב ווז' היא ליח'יה",
  },
  "שאבן עילו ליחייה": {
    translit: "שַאבּ וּעֵילוֹ לִחְיֵה",
    ar: "شاب وإله لحية",
    he: "בחור ויש לו זקן",
    chatifaiNote: "הפירוש מ-chatifai — אריאל סימן את השורה בסימן שאלה ולא רשם פירוש",
  },
};

/**
 * Not inserted. For each, chatifai's first answer pointed a different word than
 * the one heard, and pressed on the heard form it produced something that is
 * not a word, or a word with another meaning. Ariel decides.
 */
export const HELD: { heard: string; first: string; insisted: string }[] = [
  { heard: "בדי יאתי", first: "בִּדִּי יַאכִּי — بدي إياكي", insisted: "בִּדִּי יַאתִי — بدي ياتي (لا مילה)" },
  { heard: "מומרת", first: "מֻמַרִד' — ممرض (זכר)", insisted: "מֻמַרִּת — ممرضة (הניקוד איבד את ה-ض)" },
  { heard: "מח'יים אלעג'ין", first: "מֻחַ'יַּם אִלְלַאגִ'אִין — مخيم اللاجئين", insisted: "מֻחַ'יַּם אִלְעַגִ'ין — مخيم العجين (\"מחנה הבצק\")" },
  { heard: "ע'ריר", first: "עֵ'יר — غير", insisted: "עַ'רִיר — אבל הערבית נשארה غير" },
  { heard: "ע'רירו", first: "עֵ'ירוֹ — غيره", insisted: "עַ'רִירֹו — אבל הערבית נשארה غيره" },
  { heard: "ביג'נם", first: "—", insisted: "בִּגַ'נֵּם — بيجنن, \"מטריף\" — מילה אחרת, ולא מתאים להקשר של היה/להיות" },
];
