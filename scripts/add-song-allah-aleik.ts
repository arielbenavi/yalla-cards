/**
 * Inserts "Allah Aleik Ya Seedy (الله عليك يا سيدي)" by Ehab Tawfik into the songs table.
 * Egyptian Arabic lyrics with word-by-word Hebrew nikud, meanings, and Latin transliteration.
 *
 * Run: npx tsx scripts/add-song-allah-aleik.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

type LyricWord = { ar: string; he: string; translit: string };
type LyricLine = { line: string; words: LyricWord[] };

function ar(line: string, words: LyricWord[]): LyricLine {
  return { line, words };
}

// ─── building blocks ────────────────────────────────────────────────

// CHORUS — 5 core lines + repeat of first 2
const LINE1 = ar("אַללַּה עַלֵיכּ יַא סִידִי", [
  { ar: "الله",  he: "אלוהים",  translit: "Allah"  },
  { ar: "عليك",  he: "עליך",    translit: "aleik"  },
  { ar: "يا",    he: "יא",      translit: "ya"     },
  { ar: "سيدي",  he: "אדוני",   translit: "seedy"  },
]);

const LINE2 = ar("אַלְבַּכּ דַאבּ פִי אִידִי", [
  { ar: "قلبك",  he: "ליבך",    translit: "albak"  },
  { ar: "داب",   he: "נמס",     translit: "dab"    },
  { ar: "في",    he: "ב-",      translit: "fi"     },
  { ar: "إيدي",  he: "ידי",     translit: "eidi"   },
]);

const LINE3 = ar("וַאַנַא אִלִּי בִּיכּ דַארִי", [
  { ar: "وأنا",   he: "ואני",   translit: "wa-ana" },
  { ar: "اللي",   he: "אשר",    translit: "illi"   },
  { ar: "بيك",    he: "בך",     translit: "beek"   },
  { ar: "داري",   he: "מודע",   translit: "dari"   },
]);

const LINE4 = ar("וּבְּעֻמְרִי אַנַא שַארִי", [
  { ar: "وبعمري", he: "ובחיי",  translit: "u-b-umri" },
  { ar: "أنا",    he: "אני",    translit: "ana"      },
  { ar: "شاري",   he: "קונה",   translit: "shari"    },
]);

const LINE5 = ar("בַּס אִנְתֵ בִּתְדַארִי", [
  { ar: "بس",      he: "אבל",    translit: "bass"    },
  { ar: "إنت",     he: "אתה",    translit: "inte"    },
  { ar: "بتداري",  he: "מסתיר",  translit: "bitdari" },
]);

const CHORUS: LyricLine[] = [LINE1, LINE2, LINE3, LINE4, LINE5, LINE1, LINE2];
const SHORT_CHORUS: LyricLine[] = [LINE3, LINE4, LINE5];

// VERSE 1
const VERSE1: LyricLine[] = [
  ar("אִסְמַע כַּלַאמִי סַלֵּם לִעַ'רַאמִי", [
    { ar: "إسمع",   he: "שמע",        translit: "isma"        },
    { ar: "كلامي",  he: "דבריי",      translit: "kalami"      },
    { ar: "سلم",    he: "היכנע",      translit: "sallem"      },
    { ar: "لغرامي", he: "לאהבתי",     translit: "li-gharami"  },
  ]),
  ar("דֵה הַוַאכּ אֻדַּאמִי וִ(אל)שּוֹאְ וַרַאיַא", [
    { ar: "ده",      he: "זה",          translit: "deh"       },
    { ar: "هواك",    he: "אהבתך",       translit: "hawak"     },
    { ar: "قدامي",   he: "מולי",        translit: "uddami"    },
    { ar: "والشوق",  he: "והגעגוע",     translit: "u-sh-sho'" },
    { ar: "ورايا",   he: "מאחוריי",     translit: "waraya"    },
  ]),
  ar("מַא תְאוּלְש עַאדִי חֻבַּכּ מֻש הַאדִי", [
    { ar: "ما تقولش", he: "אל תגיד",   translit: "ma t'ulsh" },
    { ar: "عادي",     he: "רגיל",       translit: "adi"       },
    { ar: "حبك",      he: "אהבתך",      translit: "hubbak"    },
    { ar: "مش",       he: "לא",         translit: "mush"      },
    { ar: "هادي",     he: "רגוע",       translit: "hadi"      },
  ]),
  ar("אַלְבַּכּ בִּינַאדִי מַע צוֹת נִדַאיַא", [
    { ar: "قلبك",   he: "ליבך",        translit: "albak"   },
    { ar: "بينادي", he: "קורא",        translit: "binadi"  },
    { ar: "مع",     he: "עם",          translit: "ma"      },
    { ar: "صوت",    he: "קול",         translit: "sot"     },
    { ar: "ندايا",  he: "קריאתי",      translit: "nidaya"  },
  ]),
];

// VERSE 2
const VERSE2: LyricLine[] = [
  ar("אַלְבַּכּ נַאוִוילִי מַכְּסוּף יִנַאדִילִי", [
    { ar: "قلبك",    he: "ליבך",          translit: "albak"     },
    { ar: "ناويلي",  he: "מתכוון אליי",   translit: "nawili"    },
    { ar: "مكسوف",   he: "מתבייש",        translit: "maksuf"    },
    { ar: "يناديلي", he: "קורא לי",       translit: "yinadili"  },
  ]),
  ar("וִאִשְתַאְת יַא וֵילִי וִ(אל)שּוֹאְ רַמַאנִי", [
    { ar: "وإشتقت",  he: "והתגעגעתי",    translit: "u-ishtat"   },
    { ar: "يا ويلي", he: "אוי לי",        translit: "ya weili"   },
    { ar: "والشوق",  he: "והגעגוע",       translit: "u-sh-sho'"  },
    { ar: "رماني",   he: "השליך אותי",    translit: "ramani"     },
  ]),
  ar("עֵינַכּ פִי עֵינִי מַא תְאוּלְש נַאסִינִי", [
    { ar: "عينك",     he: "עינך",         translit: "einak"     },
    { ar: "في عيني",  he: "בעיני",        translit: "fi eini"   },
    { ar: "ما تقولش", he: "אל תגיד",      translit: "ma t'ulsh" },
    { ar: "ناسيني",   he: "שוכח אותי",    translit: "nasini"    },
  ]),
  ar("דֵה אִנְתֵ יַא מֻנַא עֵינִי מַחְ'לוּאְ עַשַאנִי", [
    { ar: "ده",         he: "זה",            translit: "deh"       },
    { ar: "إنت",        he: "אתה",           translit: "inte"      },
    { ar: "يا منى عيني",he: "משאלת עיניי",  translit: "ya muna eini" },
    { ar: "مخلوق",      he: "נברא",          translit: "makhlu'"   },
    { ar: "عشاني",      he: "בשבילי",        translit: "ashani"    },
  ]),
];

// ─── full lyrics ────────────────────────────────────────────────────
const LYRICS_PARSED: LyricLine[] = [
  // CHORUS (opening)
  ...CHORUS,
  // VERSE 1 (× 2)
  ...VERSE1,
  ...VERSE1,
  // SHORT CHORUS + FULL CHORUS
  ...SHORT_CHORUS,
  ...CHORUS,
  // VERSE 2 (× 2)
  ...VERSE2,
  ...VERSE2,
  // OUTRO CHORUS (× 2)
  ...CHORUS,
  ...CHORUS,
];

const LYRICS_RAW = `الله عليك يا سيدي
قلبك داب في إيدي
وأنا اللي بيك داري
وبعمري أنا شاري
بس إنت بتداري
الله عليك يا سيدي
قلبك داب في إيدي

إسمع كلامي سلم لغرامي
ده هواك قدامي والشوق ورايا
ما تقولش عادي حبك مش هادي
قلبك بينادي مع صوت ندايا
إسمع كلامي سلم لغرامي
ده هواك قدامي والشوق ورايا
ما تقولش عادي حبك مش هادي
قلبك بينادي مع صوت ندايا

وأنا اللي بيك داري
وبعمري أنا شاري
بس إنت بتداري
الله عليك يا سيدي
قلبك داب في إيدي
وأنا اللي بيك داري
وبعمري أنا شاري
بس إنت بتداري
الله عليك يا سيدي
قلبك داب في إيدي

قلبك ناويلي مكسوف يناديلي
وإشتقت يا ويلي والشوق رماني
عينك في عيني ما تقولش ناسيني
ده إنت يا منى عيني مخلوق عشاني
قلبك ناويلي مكسوف يناديلي
وإشتقت يا ويلي والشوق رماني
عينك في عيني ما تقولش ناسيني
ده إنت يا منى عيني مخلوق عشاني

الله عليك يا سيدي
قلبك داب في إيدي
وأنا اللي بيك داري
وبعمري أنا شاري
بس إنت بتداري
الله عليك يا سيدي
قلبك داب في إيدي
الله عليك يا سيدي
قلبك داب في إيدي
وأنا اللي بيك داري
وبعمري أنا شاري
بس إنت بتداري
الله عليك يا سيدي
قلبك داب في إيدي`;

async function main() {
  await sb.from("songs").delete().eq("title", "Allah Aleik Ya Seedy").eq("artist", "Ehab Tawfik");

  const { data, error } = await sb
    .from("songs")
    .insert({
      title: "Allah Aleik Ya Seedy",
      artist: "Ehab Tawfik",
      youtube_url: "https://www.youtube.com/watch?v=7rDzb3JMQno",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed: LYRICS_PARSED,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌", error.message);
    process.exit(1);
  }

  console.log(`✅ Allah Aleik Ya Seedy הוכנס — id: ${data.id}`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length > 0).length} שורות עם תרגום`);
}

main();
