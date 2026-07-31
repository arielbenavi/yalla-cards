/**
 * Inserts "Immer" by JAZEEK x DYSTINCT into the songs table.
 * Arabic/Darija lines: word-by-word translations & transliteration.
 * German/French/English lines: kept as-is, no translation (empty words array).
 *
 * Run: npx tsx scripts/add-song-immer.ts
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
type LyricLine = { line: string; words: LyricWord[]; timestamp?: string };

// ─── helpers ───────────────────────────────────────────────────────
function nonAr(line: string): LyricLine {
  return { line, words: [] };
}

function ar(line: string, words: LyricWord[]): LyricLine {
  return { line, words };
}

// ─── repeated sections ─────────────────────────────────────────────

const PRE_CHORUS: LyricLine[] = [
  ar("واخا فيها لهبال نبغيها", [
    { ar: "واخا",    he: "אפילו ש",          translit: "wakha"   },
    { ar: "فيها",    he: "בה",               translit: "fiha"    },
    { ar: "لهبال",   he: "השטות/הטירוף",      translit: "l-hbal"  },
    { ar: "نبغيها",  he: "אני רוצה אותה",    translit: "nbghiha" },
  ]),
  ar("واخا ماشي مزيانة باقي كاينة", [
    { ar: "واخا",    he: "אפילו ש",  translit: "wakha"  },
    { ar: "ماشي",    he: "לא",       translit: "mashi"  },
    { ar: "مزيانة",  he: "טובה",     translit: "mzyana" },
    { ar: "باقي",    he: "עדיין",    translit: "baqi"   },
    { ar: "كاينة",   he: "שם / קיימת", translit: "kayna" },
  ]),
  ar("واخا فيها لهبال نبغيها", [
    { ar: "واخا",   he: "אפילו ש",        translit: "wakha"   },
    { ar: "فيها",   he: "בה",             translit: "fiha"    },
    { ar: "لهبال",  he: "השטות/הטירוף",    translit: "l-hbal"  },
    { ar: "نبغيها", he: "אני רוצה אותה",  translit: "nbghiha" },
  ]),
  ar("واخا ماشي مزيانة", [
    { ar: "واخا",   he: "אפילו ש", translit: "wakha"  },
    { ar: "ماشي",   he: "לא",      translit: "mashi"  },
    { ar: "مزيانة", he: "טובה",    translit: "mzyana" },
  ]),
];

const CHORUS: LyricLine[] = [
  nonAr("Immer, immer, immer"),
  nonAr("Immer, immer, immer"),
  nonAr("Wenn du mir fehlst, rufe ich dich an"),
  nonAr("Immer, immer, immer"),
  nonAr("Immer, immer, immer"),
];

// ─── full lyrics ────────────────────────────────────────────────────
const LYRICS_PARSED: LyricLine[] = [
  // INTRO
  nonAr("بابابا، با، بابابا"),
  nonAr("(Unleaded)"),
  nonAr("Ja"),
  nonAr("Yeah"),

  // PRE-CHORUS
  ...PRE_CHORUS,

  // CHORUS
  ...CHORUS,

  // VERSE 1
  nonAr("Tiffany & Co."),
  ar("ما باغية love، نو، نو", [
    { ar: "ما",     he: "לא",   translit: "ma"     },
    { ar: "باغية",  he: "רוצה", translit: "baghya" },
  ]),
  ar("ما فهمت والو أنا", [
    { ar: "ما",    he: "לא",    translit: "ma"    },
    { ar: "فهمت",  he: "הבנתי", translit: "fhamt" },
    { ar: "والو",  he: "כלום",  translit: "walu"  },
    { ar: "أنا",   he: "אני",   translit: "ana"   },
  ]),
  ar("Immer, باقي كاينة", [
    { ar: "باقي",  he: "עדיין",     translit: "baqi"  },
    { ar: "كاينة", he: "שם / קיימת", translit: "kayna" },
  ]),
  nonAr("Immer, immer, immer, immer, immer, immer, immer"),
  ar("فالتيليفون واحشاني، l′amour اللي غمض لي عيني", [
    { ar: "فالتيليفون", he: "בטלפון",            translit: "f-l-tilifun" },
    { ar: "واحشاني",    he: "אני מתגעגע אליה",   translit: "wa7shani"    },
    { ar: "اللي",       he: "שה",                translit: "lli"         },
    { ar: "غمض",        he: "עצם / סגר",          translit: "ghmed"       },
    { ar: "لي",         he: "לי",                translit: "li"          },
    { ar: "عيني",       he: "עיניים שלי",         translit: "'ayni"       },
  ]),
  ar("ديتي (فرر) ڭلبي، خليتي (همم) nada", [
    { ar: "ديتي",   he: "עשית / הפכת",  translit: "diti"     },
    { ar: "ڭلبي",   he: "ללבי",         translit: "qalbi"    },
    { ar: "خليتي",  he: "השארת",        translit: "khalliti" },
  ]),
  ar("Bébé, بشوية، بشوية، بشوية", [
    { ar: "بشوية", he: "לאט לאט", translit: "bshwiya" },
  ]),

  // PRE-CHORUS
  ...PRE_CHORUS,

  // CHORUS
  ...CHORUS,

  // VERSE 2 — German only
  nonAr("Immer, immer, immer, immer, immer"),
  nonAr("Wenn ich weg bin, lässt du andre in das gleiche Zimmer"),
  nonAr("Wo kein andrer, außer ich, dich zu allem bring'n kann"),
  nonAr("Sag mir, kannst du dich noch dran erinnern? (Ja, ja, ja)"),
  nonAr("Oh-ah, ich gab dir alles, was ich habe, doch du lügst mir ins Gesicht"),
  nonAr("Glaub mir, ich war das Beste für jemanden wie dich"),
  nonAr("Du sagst, du tust alles für mich, aber du tust nichts, yeah"),

  // PRE-CHORUS
  ...PRE_CHORUS,

  // CHORUS
  ...CHORUS,
];

const LYRICS_RAW = `بابابا، با، بابابا
(Unleaded)
Ja
Yeah

واخا فيها لهبال نبغيها
واخا ماشي مزيانة باقي كاينة
واخا فيها لهبال نبغيها
واخا ماشي مزيانة

Immer, immer, immer
Immer, immer, immer
Wenn du mir fehlst, rufe ich dich an
Immer, immer, immer
Immer, immer, immer

Tiffany & Co.
ما باغية love، نو، نو
ما فهمت والو أنا
Immer, باقي كاينة
Immer, immer, immer, immer, immer, immer, immer
فالتيليفون واحشاني، l′amour اللي غمض لي عيني
ديتي (فرر) ڭلبي، خليتي (همم) nada
Bébé, بشوية، بشوية، بشوية

واخا فيها لهبال نبغيها
واخا ماشي مزيانة باقي كاينة
واخا فيها لهبال نبغيها
واخا ماشي مزيانة

Immer, immer, immer
Immer, immer, immer
Wenn du mir fehlst, rufe ich dich an
Immer, immer, immer
Immer, immer, immer

Immer, immer, immer, immer, immer
Wenn ich weg bin, lässt du andre in das gleiche Zimmer
Wo kein andrer, außer ich, dich zu allem bring'n kann
Sag mir, kannst du dich noch dran erinnern? (Ja, ja, ja)
Oh-ah, ich gab dir alles, was ich habe, doch du lügst mir ins Gesicht
Glaub mir, ich war das Beste für jemanden wie dich
Du sagst, du tust alles für mich, aber du tust nichts, yeah

واخا فيها لهبال نبغيها
واخا ماشي مزيانة باقي كاينة
واخا فيها لهبال نبغيها
واخا ماشي مزيانة

Immer, immer, immer
Immer, immer, immer
Wenn du mir fehlst, rufe ich dich an
Immer, immer, immer
Immer, immer, immer`;

async function main() {
  // Remove existing Immer entry if any
  await sb.from("songs").delete().eq("title", "Immer").eq("artist", "JAZEEK x DYSTINCT");

  const { data, error } = await sb
    .from("songs")
    .insert({
      title: "Immer",
      artist: "JAZEEK x DYSTINCT",
      youtube_url: "https://www.youtube.com/watch?v=eGxQNw0QJjo",
      lyrics_raw: LYRICS_RAW,
      lyrics_parsed: LYRICS_PARSED,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌", error.message);
    process.exit(1);
  }

  console.log(`✅ Immer הוכנס — id: ${data.id}`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length > 0).length} שורות עם תרגום`);
  console.log(`   ${LYRICS_PARSED.filter(l => l.words.length === 0).length} שורות ללא תרגום (גרמנית/שאר)`);
}

main();
