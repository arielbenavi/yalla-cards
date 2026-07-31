/**
 * Inserts "ZIDI" by DYSTINCT into the songs table.
 * Moroccan Darija/Arabic lyrics with word-by-word Hebrew nikud, meanings, and Latin transliteration.
 * Spanish/Turkish lines kept as-is (empty words array).
 *
 * Run: npx tsx scripts/add-song-zidi.ts
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

function nonAr(line: string): LyricLine {
  return { line, words: [] };
}
function ar(line: string, words: LyricWord[]): LyricLine {
  return { line, words };
}

// ─── repeated sections ─────────────────────────────────────────────

const CHORUS: LyricLine[] = [
  ar("זִידִי זִידִי", [
    { ar: "زيدي", he: "עוד/הוסיפי", translit: "zidi" },
    { ar: "زيدي", he: "עוד/הוסיפי", translit: "zidi" },
  ]),
  ar("תַּעַאל יַא חַבִּיבִּי", [
    { ar: "تعال",  he: "בוא",              translit: "ta'al"  },
    { ar: "يا",    he: "יא (פנייה)",        translit: "ya"     },
    { ar: "حبيبي", he: "אהובי",            translit: "habibi" },
  ]),
  ar("אַנַא בִּחִבַּכּ", [
    { ar: "أنا",  he: "אני",            translit: "ana"      },
    { ar: "بحبك", he: "אוהב אותך",      translit: "bihibbak" },
  ]),
  ar("ח'וּדִי ח'וּדִי קַלְבִּי", [
    { ar: "خودي",  he: "קחי",   translit: "khudi" },
    { ar: "خودي",  he: "קחי",   translit: "khudi" },
    { ar: "قلبي",  he: "ליבי",  translit: "qalbi" },
  ]),
  ar("זִידִי זִידִי", [
    { ar: "زيدي", he: "עוד/הוסיפי", translit: "zidi" },
    { ar: "زيدي", he: "עוד/הוסיפי", translit: "zidi" },
  ]),
  ar("תַּעַאל יַא חַבִּיבִּי", [
    { ar: "تعال",  he: "בוא",       translit: "ta'al"  },
    { ar: "يا",    he: "יא (פנייה)", translit: "ya"     },
    { ar: "حبيبي", he: "אהובי",     translit: "habibi" },
  ]),
  ar("אַנַא בִּחִבַּכּ", [
    { ar: "أنا",  he: "אני",       translit: "ana"      },
    { ar: "بحبك", he: "אוהב אותך", translit: "bihibbak" },
  ]),
  ar("ח'וּדִי ח'וּדִי קַלְבִּי", [
    { ar: "خودي", he: "קחי",  translit: "khudi" },
    { ar: "خودي", he: "קחי",  translit: "khudi" },
    { ar: "قلبي", he: "ליבי", translit: "qalbi" },
  ]),
];

const VERSE: LyricLine[] = [
  ar("וַאַנַא לֵילַכּ", [
    { ar: "و",    he: "ו-",        translit: "wa"    },
    { ar: "أنا",  he: "אני",       translit: "ana"   },
    { ar: "ليلك", he: "הלילה שלך", translit: "leilak"},
  ]),
  ar("וַאַנְתִי לִיַא", [
    { ar: "وأنتي", he: "ואת", translit: "wa-anti" },
    { ar: "ليا",   he: "לי",  translit: "liya"    },
  ]),
  ar("נַארִי יַא נַארִי", [
    { ar: "ناري", he: "האש שלי", translit: "nari" },
    { ar: "يا",   he: "יא",      translit: "ya"   },
    { ar: "ناري", he: "האש שלי", translit: "nari" },
  ]),
  ar("חֻבַּכּ יְדַאוִוִינִי", [
    { ar: "حبك",     he: "אהבתך",      translit: "hubbak"   },
    { ar: "يداويني", he: "מרפא אותי",  translit: "yidawini" },
  ]),
  ar("וַאַנַא לֵילַכּ", [
    { ar: "و",    he: "ו-",        translit: "wa"    },
    { ar: "أنا",  he: "אני",       translit: "ana"   },
    { ar: "ليلك", he: "הלילה שלך", translit: "leilak"},
  ]),
  ar("וַאַנְתִי לִיַא", [
    { ar: "وأنتي", he: "ואת", translit: "wa-anti" },
    { ar: "ليا",   he: "לי",  translit: "liya"    },
  ]),
  ar("נַארִי יַא נַארִי", [
    { ar: "ناري", he: "האש שלי", translit: "nari" },
    { ar: "يا",   he: "יא",      translit: "ya"   },
    { ar: "ناري", he: "האש שלי", translit: "nari" },
  ]),
  ar("חֻבַּכּ יְדַאוִוִינִי", [
    { ar: "حبك",     he: "אהבתך",     translit: "hubbak"   },
    { ar: "يداويني", he: "מרפא אותי", translit: "yidawini" },
  ]),
];

const BRIDGE: LyricLine[] = [
  ar("פִי בִּלַאדִי נְקוּלַכּ קַלְבִּי", [
    { ar: "في",     he: "ב-",        translit: "fi"      },
    { ar: "بلادي",  he: "ארצי",      translit: "biladi"  },
    { ar: "نقولك",  he: "אגיד לך",   translit: "nqullak" },
    { ar: "قلبي",   he: "ליבי",      translit: "qalbi"   },
  ]),
  ar("פִי בִּלַאדִי נְקוּלַכּ קַלְבִּי", [
    { ar: "في",    he: "ב-",       translit: "fi"      },
    { ar: "بلادي", he: "ארצי",     translit: "biladi"  },
    { ar: "نقولك", he: "אגיד לך",  translit: "nqullak" },
    { ar: "قلبي",  he: "ליבי",     translit: "qalbi"   },
  ]),
  ar("וּבִּ(א)לְמַצְרִיֵה קַלְבִּי", [
    { ar: "وبالمصرية", he: "ובמצרית", translit: "wa-bil-masriya" },
    { ar: "قلبي",      he: "ליבי",    translit: "qalbi"           },
  ]),
  ar("אָה יַא רוּחִי אָה יַא חַיַאתִי", [
    { ar: "آه",    he: "אה (קריאה)", translit: "ah"     },
    { ar: "يا",    he: "יא",         translit: "ya"     },
    { ar: "روحي",  he: "נשמתי",      translit: "ruhi"   },
    { ar: "آه",    he: "אה",         translit: "ah"     },
    { ar: "يا",    he: "יא",         translit: "ya"     },
    { ar: "حياتي", he: "חיי",        translit: "hayati" },
  ]),
  ar("בִּ(א)לְתֻּרְכִּיֵה נְקוּלַכּ עַאשְקִם", [
    { ar: "بالتركية", he: "בטורקית",             translit: "bi-turkiya" },
    { ar: "نقولك",    he: "אגיד לך",              translit: "nqullak"    },
    { ar: "عاشقم",    he: "אוהב אותך (טורקית)",  translit: "ashiqim"    },
  ]),
  ar("פִי אִסְבַּאנְיַא מִי אָמוֹר", [
    { ar: "في",       he: "ב-",                  translit: "fi"      },
    { ar: "إسبانيا",  he: "ספרד",                translit: "isbanya" },
    { ar: "مي أمور",  he: "אהובי (ספרדית)",      translit: "mi amor" },
  ]),
  ar("תִי קִיֵירוֹ אָה יַא חַבִּיבִּי", [
    { ar: "تي كييرو", he: "אני אוהב אותך (ספרדית)", translit: "te quiero" },
    { ar: "آه",       he: "אה",                       translit: "ah"        },
    { ar: "يا",       he: "יא",                       translit: "ya"        },
    { ar: "حبيبي",    he: "אהובי",                   translit: "habibi"    },
  ]),
];

const GUELI: LyricLine[] = [
  ar("אָה קוּלִי", [
    { ar: "آه",   he: "אה",     translit: "ah"   },
    { ar: "قولي", he: "תגידי",  translit: "quli" },
  ]),
  ar("קוּלִי", [{ ar: "قولي", he: "תגידי", translit: "quli" }]),
  ar("קוּלִי", [{ ar: "قولي", he: "תגידי", translit: "quli" }]),
  ar("קוּלִי", [{ ar: "قولي", he: "תגידי", translit: "quli" }]),
  ar("קוּלִי", [{ ar: "قولي", he: "תגידי", translit: "quli" }]),
];

const OUTRO: LyricLine[] = [
  ar("וַאשְנוּ הַדַא", [
    { ar: "واشنو", he: "מה זה",  translit: "washnu" },
    { ar: "هدا",   he: "זה",     translit: "hada"   },
  ]),
  ar("מַעַאכּ אַנְתִיַא", [
    { ar: "معاك",   he: "איתך", translit: "ma'ak"  },
    { ar: "أنتيا",  he: "את",   translit: "antiya" },
  ]),
  ar("חַסֵּית בִּ(א)לְסַּעַאדַה", [
    { ar: "حسيت",     he: "הרגשתי", translit: "hasseit"  },
    { ar: "بالسعادة", he: "באושר",  translit: "bi-sa'ada"},
  ]),
  ar("מַאש חַאסְבַּכּ", [
    { ar: "ماش",   he: "לא",            translit: "mash"   },
    { ar: "حاسبك", he: "מחשיב אותך",   translit: "hasbak" },
  ]),
  ar("אַנַא חַבִּיבַּכּ", [
    { ar: "أنا",    he: "אני",    translit: "ana"     },
    { ar: "حبيبك",  he: "אהובך",  translit: "habibak" },
  ]),
  ar("וַאַנַא שַאיְפַכּ פִי כֻּל שִי", [
    { ar: "و",       he: "ו-",         translit: "wa"      },
    { ar: "أنا",     he: "אני",        translit: "ana"     },
    { ar: "شايفك",   he: "רואה אותך", translit: "shaifak" },
    { ar: "في",      he: "ב-",         translit: "fi"      },
    { ar: "كل شيء",  he: "כל דבר",    translit: "kull shi"},
  ]),
];

// ─── full lyrics ────────────────────────────────────────────────────
const LYRICS_PARSED: LyricLine[] = [
  // CHORUS
  ...CHORUS,
  // VERSE 1
  ...VERSE,
  // BRIDGE (languages)
  ...BRIDGE,
  // CHORUS
  ...CHORUS,
  // VERSE 2
  ...VERSE,
  // GUELI SECTION
  ...GUELI,
  // OUTRO
  ...OUTRO,
  // FINAL CHORUS
  ...CHORUS,
];

const LYRICS_RAW = `زيدي زيدي
تعال يا حبيبي
أنا بحبك
خودي خودي قلبي
زيدي زيدي
تعال يا حبيبي
أنا بحبك
خودي خودي قلبي

وأنا ليلك
وأنتي ليا
ناري يا ناري
حبك يداويني
وأنا ليلك
وأنتي ليا
ناري يا ناري
حبك يداويني
في بلادي نقولك قلبي
في بلادي نقولك قلبي
و بالمصرية قلبي
آه يا روحي آه يا حياتي
بالتركية نقولك عاشقم
في إسبانيا مي أمور
تي كييرو آه يا حبيبي

زيدي زيدي
تعال يا حبيبي
أنا بحبك
خودي خودي قلبي
زيدي زيدي
تعال يا حبيبي
أنا بحبك
خودي خودي قلبي

وأنا ليلك
وأنتي ليا
ناري يا ناري
حبك يداويني
وأنا ليلك
وأنتي ليا
ناري يا ناري
حبك يداويني

آه قولي
قولي
قولي
قولي
قولي

واشنو هدا
معاك أنتيا
حسيت بالسعادة
ماش حاسبك
أنا حبيبك
وأنا شايفك في كل شيء
زيدي زيدي
تعال يا حبيبي
أنا بحبك
خودي خودي قلبي
زيدي زيدي
تعال يا حبيبي
أنا بحبك
خودي خودي قلبي`;

async function main() {
  await sb.from("songs").delete().eq("title", "ZIDI").eq("artist", "DYSTINCT");

  const { data, error } = await sb
    .from("songs")
    .insert({
      title: "ZIDI",
      artist: "DYSTINCT",
      youtube_url: "https://www.youtube.com/watch?v=K-n48kDYkNU",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed: LYRICS_PARSED,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌", error.message);
    process.exit(1);
  }

  console.log(`✅ ZIDI הוכנס — id: ${data.id}`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length > 0).length} שורות עם תרגום`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length === 0).length} שורות ללא תרגום`);
}

main();
