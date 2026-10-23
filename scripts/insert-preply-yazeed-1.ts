// Preply lesson 1 with Yazeed S. (2026-10-23): the words he sent after class, in
// English romanization. Each one pointed by chatifai (chat 6ada9c7bcab92323ed0bd261)
// — nikud and Arabic script only, the meaning is the teacher's. His romanization is
// kept in the notes.
//
// Skipped, already cards: Moa'alim (מְעַלֵּם), Kalam (כַּלַאם), Kilmah (כִּלְמֵה),
// Dars (דַרְס), Rohit (רֻחֵת — chatifai points it רֻחִת). Wajib goes in as וַאגִ'בּ;
// וַטִ'יפֵה, the course word for homework, is already a card.
//
//   npx tsx scripts/insert-preply-yazeed-1.ts [--apply]
// Rollback: delete from cards where lesson_id = <printed lesson id>; delete that lesson.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

const CARDS: { tr: string; ar: string; he: string; teacher: string; note?: string }[] = [
  { tr: "בַּקְרַא", ar: "بقرأ", he: "אני קורא", teacher: "Baqra'a" },
  { tr: "בַּכְּתֻבּ", ar: "بكتب", he: "אני כותב", teacher: "baktub" },
  { tr: "בַּחִסּ", ar: "بحس", he: "אני מרגיש", teacher: "Bahis" },
  { tr: "ג'וֹעַאן", ar: "جوعان", he: "רעב", teacher: "Joa'an", note: "נ׳: ג'וֹעַאנֵה" },
  // chatifai's output carried the dagesh on ב twice; written once
  { tr: "שַבַּעַאן", ar: "شبعان", he: "שבע (מאוכל)", teacher: "Shaba'an", note: "נ׳: שַבַּעַאנֵה" },
  { tr: "בִּדַּכּ", ar: "بدك", he: "אתה רוצה", teacher: "Beddak" },
  { tr: "זַהְקַאן", ar: "زهقان", he: "משועמם", teacher: "Zaha'an", note: "נ׳: זַהְקַאנֵה · בעירונית, כמו שהמורה אמר: זַהְאַאן" },
  { tr: "אַלְעַבּ", ar: "ألعب", he: "לשחק / (ש)אשחק", teacher: "Ala'ab (play)" },
  { tr: "כֻּרַתִ (אל)סַּלֵּה", ar: "كرة السلة", he: "כדורסל", teacher: "Korah al salleh" },
  { tr: "אַסְבַּח", ar: "أسبح", he: "לשחות / (ש)אשחה", teacher: "Asbah" },
  { tr: "אַלְעַאבּ", ar: "ألعاب", he: "משחקים", teacher: "Ala'ab (games)", note: "שם עצם ברבים — לא הפועל אַלְעַבּ" },
  { tr: "בַּדְרֻס", ar: "بدرس", he: "אני לומד", teacher: "Badrus" },
  { tr: "בַּעַלֵּם", ar: "بعلم", he: "אני מלמד", teacher: "Ba'alim" },
  { tr: "וַאגִ'בּ", ar: "واجب", he: "שיעורי בית", teacher: "Wajib", note: "בספר הקורס: וַטִ'יפֵה (وظيفة)" },
  { tr: "בַּעְרֵף", ar: "بعرف", he: "אני יודע", teacher: "Ba'arif" },
  { tr: "כַּלִמַאת", ar: "كلمات", he: "מילים", teacher: "Kalimat", note: "יחיד: כִּלְמֵה" },
  { tr: "כַּמַאן שְוַיְּ", ar: "كمان شوي", he: "עוד מעט / בעוד קצת", teacher: "Kaman shway" },
];

async function main() {
  for (const c of CARDS) console.log(`${c.tr}  ·  ${c.ar}  ·  ${c.he}   (${c.teacher})`);
  if (!APPLY) return console.log(`\n${CARDS.length} cards — dry run, add --apply`);

  const { data: lesson, error: le } = await sb
    .from("lessons")
    .insert({ title: "Preply Yazeed S. 1", date: "2026-10-23", source: "preply", teacher: "Yazeed S.", meeting: 1 })
    .select("id")
    .single();
  if (le) throw le;
  console.log("lesson", lesson.id);

  const rows = CARDS.map((c) => ({
    translit_nikud: normalizeMarks(c.tr),
    arabic_script: c.ar,
    hebrew_meaning: c.he,
    notes: [`Preply · יזיד: ${c.teacher}`, c.note].filter(Boolean).join(" · "),
    item_type: c.tr.includes(" ") ? "phrase" : "word",
    lesson_id: lesson.id,
    chatifai_verified: true,
  }));
  const { data, error } = await sb.from("cards").insert(rows).select("id, translit_nikud");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const d of data!) console.log("✅", d.translit_nikud);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
