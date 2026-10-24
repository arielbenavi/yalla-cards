// Words Ariel asked for (2026-10-23), every form from chatifai
// (chat 6ada9c7bcab92323ed0bd261), into מילים שביקשתי so they reach the daily queue.
//
// - "הרבה זמן לא התראנו": chatifai gives שוּ הַ(א)לְעֵ'יבֵּה? (same to a man, a woman
//   or several), answered by חַיּ מִין שַאיְפַכּ. It first wrote the reply חִ'י with
//   ח'; asked again, it corrected itself to חַיּ — ح, not خ.
// - אַטְרַאף, plural of טַרַף, as its own card (it was only in טַרַף's plural field).
// - later the same evening (--second): טַבְּעַן, and אִשְתַקְנַאלַכּ, the line chatifai
//   offered after שוּ הַ(א)לְעֵ'יבֵּה; its "I missed you" forms go in the note.
//
//   npx tsx scripts/insert-asked-2026-10-23.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282"; // מילים שביקשתי

const FIRST = [
  {
    translit_nikud: "שוּ הַ(א)לְעֵ'יבֵּה?",
    arabic_script: "شو هالغيبة؟",
    hebrew_meaning: "הרבה זמן לא התראנו! (מילולית: מה ההיעדרות הזאת?)",
    notes: "chatifai: אותו דבר לגבר, לאישה ולרבים · עונים: חַיּ מִין שַאיְפַכּ",
    item_type: "phrase",
  },
  {
    translit_nikud: "חַיּ מִין שַאיְפַכּ",
    arabic_script: "حي مين شايفك",
    hebrew_meaning: "התשובה ל\"הרבה זמן לא התראנו\" (מילולית: חי מי שרואה אותך)",
    notes: "chatifai · לאישה: חַיּ מִין שַאיְפֵכּ · לרבים: חַיּ מִין שַאיְפִכֹּם",
    item_type: "phrase",
  },
  {
    translit_nikud: "אַטְרַאף",
    arabic_script: "أطراف",
    hebrew_meaning: "צדדים",
    notes: "chatifai · יחיד: טַרַף · מִנּ כֻּלִּ (א)לְאַטְרַאף = מכל הצדדים",
    item_type: "word",
  },
];

const SECOND = [
  {
    translit_nikud: "טַבְּעַן",
    arabic_script: "طبعاً",
    hebrew_meaning: "כמובן / בוודאי",
    notes: "chatifai · בִּדַּכּ תִיגִ'י מַעַנַא? – טַבְּעַן! = אתה רוצה לבוא איתנו? – כמובן!",
    item_type: "word",
  },
  {
    translit_nikud: "אִשְתַקְנַאלַכּ",
    arabic_script: "إشتقنالك",
    hebrew_meaning: "התגעגענו אליך!",
    notes:
      "chatifai · לאישה: אִשְתַקְנַאלֵכּ · לרבים: אִשְתַקְנַאלְכֹּם · התגעגעתי אליך: אִשְתַקֵתְלַכּ (נ: אִשְתַקֵתְלֵכּ, ר: אִשְתַקֵתְלְכֹּם) · בעיר: אִשְתַאַנַאלַכּ · עונים: תִשְתַאק-לַכִּ (א)לְעַאפְיֵה",
    item_type: "phrase",
  },
];
const CARDS = process.argv.includes("--second") ? SECOND : FIRST;

async function main() {
  for (const c of CARDS) console.log(c.translit_nikud, "·", c.arabic_script, "·", c.hebrew_meaning);
  if (!APPLY) return console.log("dry run — add --apply");
  const { data, error } = await sb
    .from("cards")
    .insert(CARDS.map((c) => ({ ...c, lesson_id: ASKED, chatifai_verified: true })))
    .select("id, translit_nikud");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const d of data!) console.log("✅", d.translit_nikud);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
