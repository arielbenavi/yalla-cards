/**
 * Inserts "Tamally Maak (تملي معاك)" by Amr Diab into the songs table.
 * Egyptian Arabic lyrics with word-by-word Hebrew nikud, meanings, and Latin transliteration.
 *
 * Run: npx tsx scripts/add-song-tamally-maak.ts
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

const LINE_TAMALLY_MAAK = ar("תַמַלִּי מַעַאכּ", [
  { ar: "تملي",  he: "תמיד",   translit: "tamally" },
  { ar: "معاك",  he: "איתך",   translit: "ma'ak"   },
]);

const VERSE1: LyricLine[] = [
  LINE_TAMALLY_MAAK,
  ar("וַלַוְ חַתַּא בַּעִיד עַנִּי פִי אַלְבִּי הַוַאכּ", [
    { ar: "ولو",   he: "ואפילו",        translit: "walaw"  },
    { ar: "حتى",   he: "אפילו/עד",      translit: "hatta"  },
    { ar: "بعيد",  he: "רחוק",          translit: "ba'id"  },
    { ar: "عني",   he: "ממני",          translit: "anni"   },
    { ar: "في",    he: "ב-",            translit: "fi"     },
    { ar: "قلبي",  he: "ליבי",          translit: "albi"   },
    { ar: "هواك",  he: "אהבתך/תשוקה אליך", translit: "hawak"},
  ]),
  LINE_TAMALLY_MAAK,
  ar("תַמַלִּי פִי בַּאלִי וּפִי אַלְבִּי וַלַא בַּנְסַאכּ", [
    { ar: "تملي",   he: "תמיד",         translit: "tamally" },
    { ar: "في",     he: "ב-",           translit: "fi"      },
    { ar: "بالي",   he: "מחשבתי",       translit: "bali"    },
    { ar: "وفي",    he: "ובתוך",        translit: "u-fi"    },
    { ar: "قلبي",   he: "ליבי",         translit: "albi"    },
    { ar: "ولا",    he: "ולא",          translit: "wala"    },
    { ar: "بنساك",  he: "שוכח אותך",    translit: "bansak"  },
  ]),
  ar("תַמַלִּי וַאחִשְנִי לַוְ חַתַּא בַּכוּן וַיַּאכּ", [
    { ar: "تملي",    he: "תמיד",         translit: "tamally"  },
    { ar: "واحشني",  he: "חסר לי/מתגעגע", translit: "waheshni"},
    { ar: "لو",      he: "אפילו אם",      translit: "law"      },
    { ar: "حتى",     he: "אפילו",         translit: "hatta"    },
    { ar: "بكون",    he: "אני נמצא",      translit: "bakun"    },
    { ar: "وياك",    he: "איתך",          translit: "wayyak"   },
  ]),
];

const CHORUS: LyricLine[] = [
  ar("תַמַלִּי חַבִּיבִּי בַּשְתַאאְלַכּ", [
    { ar: "تملي",      he: "תמיד",            translit: "tamally"  },
    { ar: "حبيبي",     he: "אהובי",            translit: "habibi"   },
    { ar: "بشتاقلك",   he: "מתגעגע אליך",      translit: "bashtaalak"},
  ]),
  ar("תַמַלִּי עֵינַיַּא תִנְדַהְלַכּ", [
    { ar: "تملي",      he: "תמיד",           translit: "tamally"   },
    { ar: "عينيا",     he: "עיניי",           translit: "einayya"   },
    { ar: "تندهلك",    he: "קוראות לך",       translit: "tindahlak" },
  ]),
  ar("וַלַוְ חַוַאלַיַּא כֻּל (א)לְכוֹן", [
    { ar: "ولو",      he: "ואפילו",          translit: "walaw"     },
    { ar: "حواليا",   he: "מסביבי",          translit: "hawalayya" },
    { ar: "كل",       he: "כל",             translit: "kull"      },
    { ar: "الكون",    he: "היקום/העולם",    translit: "el-kon"    },
  ]),
  ar("בַּכוּן יַא חַבִּיבִּי מִחְתַאגְ'לַכּ", [
    { ar: "بكون",      he: "אני/אהיה",       translit: "bakun"     },
    { ar: "يا",        he: "יא",              translit: "ya"        },
    { ar: "حبيبي",     he: "אהובי",           translit: "habibi"    },
    { ar: "محتاجلك",   he: "זקוק לך",         translit: "mihtajlak" },
  ]),
];

const VERSE2A: LyricLine[] = [
  LINE_TAMALLY_MAAK,
  ar("מַעַאכּ אַלְבִּי מַעַאכּ רוּחִי יַא אַע'לַא חַבִּיבּ", [
    { ar: "معاك",  he: "איתך",        translit: "ma'ak"  },
    { ar: "قلبي",  he: "ליבי",        translit: "albi"   },
    { ar: "معاك",  he: "איתך",        translit: "ma'ak"  },
    { ar: "روحي",  he: "נשמתי",       translit: "ruhi"   },
    { ar: "يا",    he: "יא",          translit: "ya"     },
    { ar: "أغلى",  he: "הכי יקר",     translit: "aghla"  },
    { ar: "حبيب",  he: "אהוב",        translit: "habib"  },
  ]),
  ar("יַא אַע'לַא חַבִּיבּ", [
    { ar: "يا",    he: "יא",          translit: "ya"    },
    { ar: "أغلى",  he: "הכי יקר",    translit: "aghla" },
    { ar: "حبيب",  he: "אהוב",       translit: "habib" },
  ]),
  ar("וּמַהְמַא תְכוּן בַּעִיד עַנִּי לְאַלְבִּי אָרִיבּ", [
    { ar: "ومهما",  he: "ולא משנה כמה", translit: "u-mahma" },
    { ar: "تكون",   he: "תהיה",          translit: "tkun"    },
    { ar: "بعيد",   he: "רחוק",          translit: "ba'id"   },
    { ar: "عني",    he: "ממני",          translit: "anni"    },
    { ar: "لقلبي",  he: "לליבי",         translit: "l-albi"  },
    { ar: "قريب",   he: "קרוב",          translit: "arib"    },
  ]),
  ar("יַא עֻמְרִי (א)לְגַ'אי וִ(א)לְחַאצֵ'ר יַא אַחְלַא נַצִ'יבּ", [
    { ar: "يا",       he: "יא",          translit: "ya"       },
    { ar: "عمري",     he: "חיי",         translit: "umri"     },
    { ar: "الجاي",    he: "הבא/העתיד",   translit: "el-jay"   },
    { ar: "والحاضر",  he: "וההווה",      translit: "u-l-hadir"},
    { ar: "يا",       he: "יא",          translit: "ya"       },
    { ar: "أحلى",     he: "הכי מתוק",    translit: "ahla"     },
    { ar: "نصيب",     he: "גורל/חלק",    translit: "nasib"    },
  ]),
];

const VERSE2B: LyricLine[] = [
  LINE_TAMALLY_MAAK,
  ar("מַעַאכּ אַלְבִּי מַעַאכּ עֻמְרִי יַא אַע'לַא חַבִּיבּ", [
    { ar: "معاك",  he: "איתך",        translit: "ma'ak"  },
    { ar: "قلبي",  he: "ליבי",        translit: "albi"   },
    { ar: "معاك",  he: "איתך",        translit: "ma'ak"  },
    { ar: "عمري",  he: "חיי",         translit: "umri"   },
    { ar: "يا",    he: "יא",          translit: "ya"     },
    { ar: "أغلى",  he: "הכי יקר",     translit: "aghla"  },
    { ar: "حبيب",  he: "אהוב",        translit: "habib"  },
  ]),
  ar("יַא אַע'לַא חַבִּיבּ", [
    { ar: "يا",   he: "יא",        translit: "ya"    },
    { ar: "أغلى", he: "הכי יקר",   translit: "aghla" },
    { ar: "حبيب", he: "אהוב",      translit: "habib" },
  ]),
  ar("וּמַהְמַא תְכוּן בַּעִיד עַנִּי לְאַלְבִּי אָרִיבּ", [
    { ar: "ومهما", he: "ולא משנה כמה", translit: "u-mahma" },
    { ar: "تكون",  he: "תהיה",          translit: "tkun"    },
    { ar: "بعيد",  he: "רחוק",          translit: "ba'id"   },
    { ar: "عني",   he: "ממני",          translit: "anni"    },
    { ar: "لقلبي", he: "לליבי",         translit: "l-albi"  },
    { ar: "قريب",  he: "קרוב",          translit: "arib"    },
  ]),
  ar("יַא עֻמְרִי (א)לְגַ'אי וִ(א)לְחַאצֵ'ר יַא אַחְלַא נַצִ'יבּ", [
    { ar: "يا",      he: "יא",         translit: "ya"        },
    { ar: "عمري",    he: "חיי",        translit: "umri"      },
    { ar: "الجاي",   he: "הבא/העתיד",  translit: "el-jay"    },
    { ar: "والحاضر", he: "וההווה",     translit: "u-l-hadir" },
    { ar: "يا",      he: "יא",         translit: "ya"        },
    { ar: "أحلى",    he: "הכי מתוק",   translit: "ahla"      },
    { ar: "نصيب",    he: "גורל/חלק",   translit: "nasib"     },
  ]),
];

// ─── full lyrics ────────────────────────────────────────────────────
const LYRICS_PARSED: LyricLine[] = [
  // VERSE 1 (x2)
  ...VERSE1,
  ...VERSE1,
  // CHORUS (x2)
  ...CHORUS,
  ...CHORUS,
  // VERSE 2A
  ...VERSE2A,
  // VERSE 2B (slight variation: عمري instead of روحي)
  ...VERSE2B,
  // CHORUS (x4 at end)
  ...CHORUS,
  ...CHORUS,
  ...CHORUS,
  ...CHORUS,
];

const LYRICS_RAW = `تملي معاك
ولو حتى بعيد عني في قلبي هواك
تملي معاك
تملي في بالي وفي قلبي ولا بنساك
تملي واحشني لو حتى بكون وياك
تملي معاك
ولو حتى بعيد عني في قلبي هواك
تملي معاك
تملي في بالي وفي قلبي ولا بنساك
تملي واحشني لو حتى بكون وياك

تملي حبيبي بشتاقلك
تملي عينيا تندهلك
ولو حواليا كل الكون
بكون يا حبيبي محتاجلك
تملي حبيبي بشتاقلك
تملي عينيا تندهلك
ولو حواليا كل الكون
بكون يا حبيبي محتاجلك

تملي معاك
معاك قلبي معاك روحي يا أغلى حبيب
يا أغلى حبيب
ومهما تكون بعيد عني لقلبي قريب
يا عمري الجاي والحاضر يا أحلى نصيب
تملي معاك
معاك قلبي معاك عمري يا أغلى حبيب
يا أغلى حبيب
ومهما تكون بعيد عني لقلبي قريب
يا عمري الجاي والحاضر يا أحلى نصيب

تملي حبيبي بشتاقلك
تملي عينيا تندهلك
ولو حواليا كل الكون
بكون يا حبيبي محتاجلك
تملي حبيبي بشتاقلك
تملي عينيا تندهلك
ولو حواليا كل الكون
بكون يا حبيبي محتاجلك
تملي حبيبي بشتاقلك
تملي عينيا تندهلك
ولو حواليا كل الكون
بكون يا حبيبي محتاجلك
تملي حبيبي بشتاقلك
تملي عينيا تندهلك
ولو حواليا كل الكون
بكون يا حبيبي محتاجلك`;

async function main() {
  await sb.from("songs").delete().eq("title", "Tamally Maak").eq("artist", "Amr Diab");

  const { data, error } = await sb
    .from("songs")
    .insert({
      title: "Tamally Maak",
      artist: "Amr Diab",
      youtube_url: "https://www.youtube.com/watch?v=KhiXrDN3t2o",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed: LYRICS_PARSED,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌", error.message);
    process.exit(1);
  }

  console.log(`✅ Tamally Maak הוכנס — id: ${data.id}`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length > 0).length} שורות עם תרגום`);
}

main();
