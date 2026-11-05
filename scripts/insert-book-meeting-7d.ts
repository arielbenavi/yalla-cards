// מפגש 7, pp. 306–310: verb cards, word cards and sentence cards, the negation table as a drill
// and the sentences as a translation drill, plus the song situation's lines as cards.
// Words the deck has (by Arabic skeleton) are skipped. Never touches card_srs of existing cards.
//   npx tsx scripts/insert-book-meeting-7d.ts          # dry run
//   npx tsx scripts/insert-book-meeting-7d.ts --apply
// Rollback: delete the cards of this script by notes, and
//   delete from paradigms where slug in ('past_negation_book_306','book_translation_p309')
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fixBet } from "../lib/word-lookup";
import { NEGATION_TABLE, SENTENCES, SONG_CARDS, TRANSLATION_DRILL, VERB_CARDS, WORDS, type Row } from "./data/book-meeting-7d";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const MEETING_7 = "0f08865f-9f86-489f-b713-b67d30d0d633";
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282"; // מילים שביקשתי
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/^ال/, "");

(async () => {
  const have = new Map<string, string>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("arabic_script,translit_nikud").range(f, f + 999);
    if (error) throw error;
    for (const c of data ?? []) have.set(n(c.arabic_script ?? ""), c.translit_nikud);
    if (!data || data.length < 1000) break;
  }
  const sentences: Row[] = SENTENCES.map(([he, tr, ar], i) => [tr, ar, he, "sentence", `עמ' ${i < 8 ? 309 : 310} (${i + 1})`]);
  const all = [...VERB_CARDS, ...WORDS, ...sentences, ...SONG_CARDS];
  for (const [tr, ar] of all) {
    if (/[א-ת]/.test(ar)) throw new Error(`Hebrew in Arabic: ${ar}`);
    if (/[ء-ي]/.test(tr)) throw new Error(`Arabic in translit: ${tr}`);
    if (fixBet(tr).normalize("NFC") !== tr.normalize("NFC")) throw new Error(`ב without a dagesh: ${tr}`);
  }
  const keep = (rows: Row[]) => rows.filter((r) => !have.has(n(r[1])));
  const skip = all.filter((r) => have.has(n(r[1])));
  const toMeeting7 = [...keep(VERB_CARDS), ...keep(WORDS), ...keep(sentences)];
  const toAsked = keep(SONG_CARDS);
  skip.forEach((r) => console.log("  skip", r[0].slice(0, 30), "← יש:", have.get(n(r[1]))?.slice(0, 30)));
  console.log(`new: ${toMeeting7.length} to מפגש 7 (${keep(VERB_CARDS).length} verbs, ${keep(WORDS).length} words, ${keep(sentences).length} sentences), ${toAsked.length} song lines; ${skip.length} skipped`);
  const t = NEGATION_TABLE.data.rows;
  ["kasar", "fishel", "dihek", "wiqef"].forEach((c) => console.log(c, t.map((r) => (r as unknown as Record<string, string>)[c]).join(" | ")));
  if (!APPLY) process.exit(0);

  const insert = async (rows: Row[], lesson: string, course: boolean) => {
    if (!rows.length) return 0;
    const { data, error } = await sb.from("cards").insert(rows.map(([tr, ar, he, type, notes]) => ({
      translit_nikud: tr.normalize("NFC"), arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
      lesson_id: lesson, course_verified: course, chatifai_verified: false,
    }))).select("id");
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
    if (e2) throw e2;
    return data!.length;
  };
  const a = await insert(toMeeting7, MEETING_7, true);
  const b = await insert(toAsked, ASKED, false);
  const { error: pErr } = await sb.from("paradigms").upsert([NEGATION_TABLE, TRANSLATION_DRILL] as never[], { onConflict: "meeting,slug" });
  if (pErr) throw pErr;
  const { error: nErr } = await sb.from("notes").insert({
    tag: "cards",
    body: `chatifai: לבדוק את הערבית של ${a} הכרטיסים מעמ' 306–310 (מפגש 7) ו-${b} השורות של הסיטואציה ״שיר שאני אוהב״. נתונים ב-scripts/data/book-meeting-7d.ts. הניקוד מהספר, רק הכתיב הערבי שלי. מעמ' 306: התא מַש מַכְּסוּר נדפס עם פתח, ובשאר מֻש.`,
  });
  if (nErr) throw nErr;
  console.log("✅", a, "+", b, "cards; 12 negation drills; 20 translation sentences");
  process.exit(0);
})();
