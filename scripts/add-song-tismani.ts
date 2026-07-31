/**
 * Inserts "Tisma'ani (تسمعني)" by Nasrin Kadri into the songs table.
 * Palestinian Arabic lyrics with word-by-word Hebrew nikud, meanings, and Latin transliteration.
 *
 * Run: npx tsx scripts/add-song-tismani.ts
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

// ─── chorus ────────────────────────────────────────────────────────
const CHORUS: LyricLine[] = [
  ar("וְאִנְתֵ לַא לַא לַא תִסְמַעְנִי", [
    { ar: "وإنت",    he: "ואתה",          translit: "u-inte"   },
    { ar: "لا",      he: "לא",            translit: "la"       },
    { ar: "لا",      he: "לא",            translit: "la"       },
    { ar: "لا",      he: "לא",            translit: "la"       },
    { ar: "تسمعني",  he: "שומע אותי",     translit: "tisma'ni" },
  ]),
  ar("יַא אַלְבִּי לַא לַא תְוַגַּעְנִי", [
    { ar: "يا قلبي",  he: "ליבי שלי",      translit: "ya albi"    },
    { ar: "لا",       he: "לא",            translit: "la"         },
    { ar: "لا",       he: "לא",            translit: "la"         },
    { ar: "توجعني",   he: "תכאיב לי",      translit: "tuwaja'ni"  },
  ]),
  ar("מִן בַּעְד כֻּל הַ(א)לְאַיַּאם בִּתְזַ'ל בְּאַלְבִּי", [
    { ar: "من بعد",   he: "אחרי",          translit: "min ba'd"   },
    { ar: "كل",       he: "כל",            translit: "kull"       },
    { ar: "هالأيام",  he: "הימים האלה",    translit: "hal-ayyam"  },
    { ar: "بتظل",     he: "נשאר/נשארת",   translit: "bitzall"    },
    { ar: "بقلبي",    he: "בליבי",         translit: "b-albi"     },
  ]),
  ar("וִ(א)לְאַחְלַאם תְנַסִּינִי (א)לְע'ַרַאם", [
    { ar: "والأحلام", he: "והחלומות",      translit: "u-l-ahlam"  },
    { ar: "تنسيني",   he: "ישכיחו ממני",  translit: "tunassini"  },
    { ar: "الغرام",   he: "האהבה/התשוקה", translit: "al-gharam"  },
  ]),
];

// ─── full lyrics ────────────────────────────────────────────────────
const LYRICS_PARSED: LyricLine[] = [
  // VERSE 1
  ar("כֻּל לֵילֵה עַם שוּפַכּ", [
    { ar: "كل",    he: "כל",                          translit: "kull"   },
    { ar: "ليلة",  he: "לילה",                        translit: "leila"  },
    { ar: "عم",    he: "מילת עזר להווה מתמשך",        translit: "am"     },
    { ar: "شوفك",  he: "רואה אותך",                   translit: "shufak" },
  ]),
  ar("וּדְמוּע עֵינַיֵ בְּהַ(א)לְלַחְזֵ'ה בַּהְדִילַכּ", [
    { ar: "ودموع",      he: "ודמעות",          translit: "u-dmu'"      },
    { ar: "عيني",       he: "עיניי",            translit: "einei"       },
    { ar: "بهاللحظة",   he: "ברגע הזה",        translit: "b-hal-lahza" },
    { ar: "بهديلك",     he: "מקדישה לך",       translit: "bahdilak"    },
  ]),
  ar("כִּיף מִן דוּנַכּ בִּדִּי נַאם", [
    { ar: "كيف",       he: "איך",         translit: "kif"      },
    { ar: "من دونك",   he: "בלעדיך",      translit: "min dunak"},
    { ar: "بدي",       he: "רוצה",        translit: "biddi"    },
    { ar: "نام",       he: "לישון",       translit: "nam"      },
  ]),
  ar("כֻּל מַרַּה בִּדִּי אִחְכִּילַכּ", [
    { ar: "كل مرة",   he: "כל פעם",              translit: "kull marra" },
    { ar: "بدي",      he: "רוצה",                translit: "biddi"      },
    { ar: "إحكيلك",   he: "לספר לך / לדבר איתך", translit: "ihkilak"    },
  ]),
  ar("נַזְ'רֵת עֵינַיֵ בְּהַ(א)לְחַ'יַאל תִשְכִּילַכּ", [
    { ar: "نظرة",     he: "מבט",              translit: "nazret"      },
    { ar: "عيني",     he: "עיניי",            translit: "einei"       },
    { ar: "بهالخيال", he: "בדמיון הזה",       translit: "b-hal-khayal"},
    { ar: "تشكيلك",   he: "מציירת אותך",      translit: "tishkilak"   },
  ]),
  ar("שוּ יַא עֻמְרִי צַאר בְּהַ(א)לְזַמַאן", [
    { ar: "شو",        he: "מה",          translit: "shu"        },
    { ar: "يا عمري",   he: "חיי שלי",     translit: "ya umri"    },
    { ar: "صار",       he: "קרה/נהיה",    translit: "sar"        },
    { ar: "بهالزمان",  he: "בזמן הזה",    translit: "b-haz-zaman"},
  ]),
  ar("אַשְכִּי לַמִין? וּאַבְכִּי לַמִין?", [
    { ar: "أشكي",   he: "אתלונן",  translit: "ashki"  },
    { ar: "لمين",   he: "למי",     translit: "lamin"  },
    { ar: "وأبكي",  he: "ואבכה",   translit: "u-abki" },
    { ar: "لمين",   he: "למי",     translit: "lamin"  },
  ]),
  ar("בַּס מִן בַּעְדַכּ", [
    { ar: "بس",       he: "רק/אבל",            translit: "bass"     },
    { ar: "من بعدك",  he: "מאז שעזבת / בלעדיך", translit: "min ba'dak"},
  ]),

  // CHORUS
  ...CHORUS,

  // VERSE 2
  ar("חַ'לִּינִי בַּס אִשְכִּילַכּ", [
    { ar: "خليني",   he: "תן לי / תשאיר אותי", translit: "khallini" },
    { ar: "بس",      he: "רק",                  translit: "bass"     },
    { ar: "إشكيلك",  he: "להתלונן בפניך",       translit: "ishkilak" },
  ]),
  ar("אַנַא בִּ(א)לְלֵיל כֻּנְת בִּדִּי אַע'נִּילַכּ", [
    { ar: "انا",       he: "אני",        translit: "ana"        },
    { ar: "بالليل",    he: "בלילה",      translit: "bil-leil"   },
    { ar: "كنت",       he: "הייתי",      translit: "kunt"       },
    { ar: "بدي",       he: "רציתי",      translit: "biddi"      },
    { ar: "اغنيلك",    he: "לשיר לך",    translit: "aghannilak" },
  ]),
  ar("דְמוּע עֵינַיֵ מַא תִכְפִי מַנְדִילַכּ", [
    { ar: "دموع",     he: "דמעות",              translit: "dmu'"     },
    { ar: "عيني",     he: "עיניי",              translit: "einei"    },
    { ar: "ما تكفي",  he: "לא יספיקו",          translit: "ma tikfi" },
    { ar: "منديلك",   he: "הממחטה שלך",         translit: "mandilak" },
  ]),
  ar("וַלַכּ חַרַאם אַלְבִּי בִּידְעִילַכּ", [
    { ar: "ولك",      he: "היי / בחייך (קריאה)", translit: "walak"   },
    { ar: "حرام",     he: "חבל / מסכן",          translit: "haram"   },
    { ar: "قلبي",     he: "ליבי",                translit: "albi"    },
    { ar: "بيدعيلك",  he: "מתפלל / מייחל לך",   translit: "bid'ilak"},
  ]),

  // CHORUS (repeat)
  ...CHORUS,
];

const LYRICS_RAW = `كُل لَيْلة عَم شوفك
ودموع عينيّ بهاللحظة بهديلك
كيف مِن دونك بدّي نام
كُلّ مَرَّة بدي إحْكيلَك
نَظْرة عينيّ بهالخيال تِشْكيلَك
شو يا عُمري صار بهالزَّمان
أَشْكي لَمين؟ وأَبْكي لَمين؟
بس من بعدك

وإنت لا لا لا تِسْمَعْنِي
يا قلبي لا لا توَجَّعْنِي
من بَعْد كُلّ هالأيام بتظلّ بقلبي
والأحلام تنسّيني الغرام

خَلِّيني بس إشكيلَك
انا باللّيل كُنت بدي اغنّيلك
دموع عينيّ ما تكفي منديلَك
ولك حرام قلبي بيِدعيلك

وإنت لا لا لا تِسْمَعْنِي
يا قلبي لا لا توَجَّعْنِي
من بَعْد كُلّ هالأيام بتظلّ بقلبي
والأحلام تنسّيني الغرام`;

async function main() {
  await sb.from("songs").delete().eq("title", "Tisma'ani").eq("artist", "Nasrin Kadri");

  const { data, error } = await sb
    .from("songs")
    .insert({
      title: "Tisma'ani",
      artist: "Nasrin Kadri",
      youtube_url: "https://www.youtube.com/watch?v=d_Z_uDmvSyg",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed: LYRICS_PARSED,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌", error.message);
    process.exit(1);
  }

  console.log(`✅ Tisma'ani הוכנס — id: ${data.id}`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length > 0).length} שורות עם תרגום`);
}

main();
