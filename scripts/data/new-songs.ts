// Two songs from Ariel's "Aravit" playlist, with the lyrics he supplied.
//
// The lyrics come from him, not from a fetch — that is the shape of this
// pipeline: `lyrics_raw` is an input to the tool, not something the tool goes
// and copies out of a lyrics site.
//
// `lyrics_parsed` is filled separately, from chatifai, once it has given the
// Hebrew-pointed transliteration and the word glosses. Nothing here guesses at
// either.
//
// **Dialect warning, and it matters for a Palestinian learner.** Neither of
// these is Palestinian:
//   - براحة يا شيخة is Egyptian — دي, ازاي, بقوا, and ج pronounced g.
//   - كنا نتلاقى is Lebanese — شو حكيوا عليّا, تا أركد, and the ـي endings.
// Both are worth listening to and worth understanding; neither should be a model
// for how Ariel speaks. Cards drawn from them need that noted, or he will learn
// Cairo forms as if Tomer had said them.

export type NewSong = {
  title: string;
  artist: string;
  youtube_url: string;
  /**
   * Ariel's paste, with the YouTube page furniture removed and repeated chorus
   * lines kept once.
   *
   * Storing the chorus four times would not add a word, and it is what made the
   * coverage scanner report YAMA as missing eighteen lines when it was missing
   * none — a chorus stored once against four raw repetitions looks like loss.
   * The wording itself is untouched.
   */
  lyrics_raw: string;
  dialect: string;
  /**
   * Ariel's own Hebrew translation, where he gave one.
   *
   * Kept so the word glosses chatifai supplies can be checked against the sense
   * he already has, rather than drifting into a different reading of the line.
   */
  he_reference?: string;
  note?: string;
};

export const NEW_SONGS: NewSong[] = [
  {
    title: "براحة يا شيخة",
    artist: "بهاء سلطان",
    youtube_url: "https://www.youtube.com/watch?v=KDMZfsfB-j0",
    dialect: "מצרית — دي, ازاي, بقوا; ה-ج נהגית g. לא פלסטינית.",
    lyrics_raw: [
      "التقل خد اجازه ومكانه جه الدلال",
      "وانا قدام اللذاذه دي عندي الفين سؤال",
      "هو ازاي علي سهوه وأمته وايه النظام",
      "كل ما تعدي الحلوة اتلغبط ليه انا ف الكلام",
      "براحه شويه شويه شويه علينا يا شيخه",
      "كال الرجاله دي جالهم حاله وبقوا شُخشيخه",
      "براحه شوية شوية شوية علينا يا بابا",
      "كل الرجاله دي جالهم حاله وطلعوا غلاابه",
      "ودي نار ضرب نار دمار ضرب نار ودي نار ويلي ويلي ويلي ويلي ويلى نار",
      "العيون سكينه وارد والقوام قوام غزال",
      "تدبحنا بدم بارد شئ اكيد مش احتمال",
      "القمر في مكانه قاعد والساحة تحت في قتال",
      "والضحايا زادو واحد والمنافسه علي الجمال",
    ].join("\n"),
  },
  {
    title: "Konna Netlaka",
    artist: "Fairuz",
    youtube_url: "https://www.youtube.com/watch?v=yQMYpSWI81k",
    dialect: "לבנונית — شو حكيوا عليّا, تا أركد. לא פלסטינית.",
    lyrics_raw: [
      "كنا نتلاقى من عشية",
      "ونقعد على الجسر العتيق",
      "وتنزل على السهل الضبابي",
      "تمحي المدى وتمحي الطريق",
      "آه, ما حدا يعرف بمطرحنا",
      "غير السما وورق تشرين",
      "ويقلي بحبك أنا بحبك",
      "ويهرب فينا الغيم الحزين",
      "يا سنين إللي رحتي إرجعلي",
      "إرجعلي شي مرة إرجعيلي",
      "وإنسيني ع باب الطفولة",
      "تا أركد بشمس الطرقات",
      "ورديلي ضحكات إللي راحوا",
      "إللي بعدا بزاوايا الساحات",
      "بتذكر شو حكيوا عليّا",
      "لما نطرت وأنت نسيت",
      "وصار الشتا ينزل عليّا",
      "وإجى الصيف وإنت ما جيت",
    ].join("\n"),
  },
  {
    title: "ولا مرة",
    // The playlist row credits شريف and the album is "افضل ما غنى شريف الرزقي",
    // so Ariel's version is a cover. The song itself is Melhem Barakat's —
    // that mismatch is why searching for it by artist never converged.
    artist: "شريف الرزقي",
    youtube_url: "",
    dialect: "לבנונית — إيدي, بقرب, هوانا. לא פלסטינית.",
    note: "מקור: לחן ושירה ملحم بركات · מילים منير عبد النور. הגרסה בפלייליסט היא קאבר",
    lyrics_raw: [
      "ولا مرة كنّا سوا، ولا مرة",
      "ولا مرة جمعنا الهوى، ولا مرة",
      "ولا مرة يا حبيبي",
      "جمعنا يا حبيبي",
      "جمعنا الهوى",
      "آه يا حبيبي",
      "لمّا عيوني",
      "شافت عينيك",
      "بالليل يا روحي",
      "و غارت عليك",
      "سهران اتمنى",
      "بقرب اتهنى",
      "اتمنى إيدي",
      "تلامس إيديك",
      "و انا غنيت",
      "لعيونك غنيت",
      "لقربك غنيت",
      "غنيت غنيت و الله غنيت",
      "سهّرني ليلي",
      "و انا ليلي طال",
      "حبك حبيبي حبيبي",
      "وهم و خيال",
      "ساكن بقلبي",
      "عايش بقربي",
      "لكن هوانا",
      "صعب المنال",
    ].join("\n"),
    he_reference: [
      "ולא פעם היינו יחד, לא פעם",
      "ולא פעם אספנו את האהבה ולא פעם",
      "ולא פעם אהובי",
      "אספנו אהובי",
      "אספנו את האהבה",
      "הו אהובי",
      "כשעיני ראו את עיניך בליל נשמתי, קינאתי בך",
      "סהרורי מייחל להתקרב, מייחל שידי יחושו את ידיך",
      "ואני שרתי, לעיניך שרתי, לקרבתך שרתי, שרתי, בחיי ששרתי",
      "הייתי ער בלילי, והוא התארך",
      "אהבתך אהובי אהובי — אשליה ודמיון",
      "חי בקרבתי, אבל אהבתנו חמקמקה",
    ].join("\n"),
  },
];
