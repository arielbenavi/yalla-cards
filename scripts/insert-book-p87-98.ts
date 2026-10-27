// Book pp. 87–98 (מפגש 6): cards for every item with no card yet (2026-10-26).
// Data: scripts/data/book-p87-98.ts (read off the images at zoom).
// chatifai was down (app.chatifai.io → 404), so these go in with the book's
// pointing and chatifai_verified = false; re-check when it is back.
//
// - the words Ariel named → מילים שביקשתי (reach the daily queue first); the rest → מפגש 6
// - existing cards he named: meanings widened, moved to מילים שביקשתי
//
//   npx tsx scripts/insert-book-p87-98.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CARDS } from "./data/book-p87-98";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";

// Ariel's list: מא לו, צ'רבת, ג'רחא, חרג'ו, טלבת, ספריאת, כל אלעאלם, יא עאלי, מנשכר אללה ונחמדו,
// כיף כאן ספר, וע'ירו, אלחרמה, מח'ים ציפי, and the p. 91–93 sentences
const NAMED = new Set([
  "מַא לוֹ?", "צַ'רְבַּת", "מַפִּש גַ'רְחַא", "גַ'רְחַא", "חַ'רַג'וּ", "טַלַבְּת", "סַפַרִיַּאת", "סַפַר",
  "כֻּלּ (א)לְעַאלַם", "יַא עַ'אלִי", "מְנֻשְכֹּר אַללַּה וְנִחְמְדוֹ", "כִּיפ כַּאן (אל)סַּפַר?",
  "וְעֵ'ירוֹ", "חֻרְמֵה", "מֻחַ'יַּם צֵיפִי", "מְנִּ מַחַלּ (א)לְחַאדֵס",
]);
// Existing cards he named: [translit, new meaning or null]
const EXISTING: [string, string | null][] = [
  ["חַאלֵתְנַא בִּ(א)לְוֵיל", null],
  ["מַכְּשוּף", "גלוי, חשוף; (חשבון) במינוס"],
  ["חְסַאבְּנַא עַ(א)לְמַכְּשוּף", "החשבון שלנו במינוס (מילולית: גלוי)"],
  ["לַחַדּ", null],
  ["חַאדֵס", "תאונה, אירוע"],
  ["אַוַאעִי (א)לְעִיד", null],
  ["וְלַּא", null],
  ["חַרַאם", "אסור; חבל"],
];

const fin: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
const sk = (s: string) => s.replace(/\(א?ל?\)/g, "ל").replace(/[֑-ׇ'׳"״?؟.,!\-–:]/g, "").replace(/[ךםןףץ]/g, (c) => fin[c]).replace(/^אל|^ל/g, "").replace(/ אל| ל/g, " ").replace(/א/g, "").replace(/\s+/g, " ").trim();

(async () => {
  const { data: m6 } = await sb.from("lessons").select("id").eq("source", "book").eq("meeting", 6).single();
  const all: string[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("cards").select("translit_nikud").range(f, f + 999); all.push(...(data ?? []).map((d) => sk(d.translit_nikud ?? ""))); if (!data || data.length < 1000) break; }
  const have = new Set(all);
  // the dedupe pass marked these as existing by Arabic script or as false hits; keep the book's new ones
  const FORCE_NEW = new Set(["וַאקֵף", "קְדֵר", "עְרֵף", "אַוְקַאת", "חַאלֵה", "עִיד", "אַעְיַאד", "חַלַּאק", "אַכֵּל", "חֵ'יר", "טַלַבְּת"]);
  const SKIP = new Set(["נִמְרַה", "מַרַץ'", "מַרִיץ'", "מַכְּשוּף", "חַאדֵס", "חַרַאם", "וְלַּא", "לַחַדּ", "אַוַאעִי (א)לְעִיד"]);
  const rows = CARDS.filter(([tr]) => !SKIP.has(tr) && (FORCE_NEW.has(tr) || !have.has(sk(tr))));
  for (const [tr, , he, p] of rows) console.log(NAMED.has(tr) ? "★" : " ", p, tr, "=", he);
  console.log(rows.length, "new cards;", rows.filter(([tr]) => NAMED.has(tr)).length, "to מילים שביקשתי");
  if (!APPLY) return console.log("dry run — add --apply");
  const { data, error } = await sb.from("cards").insert(rows.map(([tr, ar, he, p, type]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type,
    notes: `ספר המדרשה עמ׳ ${p}${p === 91 ? " (פתרון עמ׳ 92)" : p === 93 ? " (תרגום עמ׳ 94)" : ""}`,
    lesson_id: NAMED.has(tr) ? ASKED : m6!.id, course_verified: true, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const [tr, he] of EXISTING) {
    const { error: e3, count } = await sb.from("cards").update({ lesson_id: ASKED, ...(he ? { hebrew_meaning: he } : {}) }, { count: "exact" }).eq("translit_nikud", tr);
    if (e3) throw e3;
    console.log("updated", tr, count);
  }
  console.log("✅", data!.length, "cards");
})();
