// The directions card ("כשאתה יוצא מהבית שלך, קח ימינה…") broken into pieces that
// had no card of their own (Ariel, 2026-10-24). Each pointed by chatifai
// (chat 6ada9c7bcab92323ed0bd261). Pieces that already exist (אִמְשִי דֻעְ'רִי,
// רַצִיף, עִיַאדֵה, לַחַדּ מַא, עַלַא פִכְּרַה, חַרַכַּת סַיַּארַאת, לַמַּא תְשוּף…)
// are not repeated. לִף gets "תפנה" added to its meaning.
//
//   npx tsx scripts/insert-directions-pieces.ts [--apply] [--extra]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282"; // מילים שביקשתי
const SRC = "מתוך הוראות הדרך (כשאתה יוצא מהבית שלך…)";

const CARDS: { tr: string; ar: string; he: string; type: string; note?: string }[] = [
  { tr: "לַמַּא תִטְלַע", ar: "لما تطلع", he: "כשאתה יוצא", type: "phrase" },
  { tr: "חֻ'וד", ar: "خد", he: "קח (ציווי לגבר)", type: "word", note: "חֻ'וד עַ-(א)לְיַמִין = קח ימינה" },
  { tr: "לוֹן", ar: "لون", he: "צבע", type: "word", note: "לוֹנוֹ = הצבע שלו · לוֹנְהַא = הצבע שלה" },
  { tr: "אַסְוַד", ar: "أسود", he: "שחור", type: "word", note: "נ׳: סַוְדַא (سوداء) · ר׳: סוּד (سود)" },
  { tr: "טֻרֻק", ar: "طرق", he: "דרכים", type: "word", note: "יחיד: טַרִיק" },
  { tr: "מַפְרַקִ (אל)טֻרֻק", ar: "مفرق الطرق", he: "צומת דרכים", type: "phrase" },
  { tr: "קֻדַּאמַכּ", ar: "قدامك", he: "לפניך / מולך", type: "word" },
  { tr: "בַּעְדֵין", ar: "بعدين", he: "אחר כך", type: "word" },
  { tr: "נַזְלֵה", ar: "نزلة", he: "ירידה", type: "word", note: "אִנְזַל פִי (אל)נַזְלֵה = תרד בירידה" },
  { tr: "תוּצַל", ar: "توصل", he: "(ש)תגיע", type: "word", note: "לַחַדּ מַא תוּצַל = עד שתגיע · אֵימְתַא בְּתוּצַל? = מתי אתה מגיע?" },
];
const EXTRA = process.argv.includes("--extra");

async function main() {
  const list = EXTRA ? EXTRA_CARDS : CARDS;
  for (const c of list) console.log(c.tr, "·", c.ar, "·", c.he);
  if (!APPLY) return console.log("dry run — add --apply");
  const { data, error } = await sb
    .from("cards")
    .insert(list.map((c) => ({
      translit_nikud: c.tr, arabic_script: c.ar, hebrew_meaning: c.he, item_type: c.type,
      notes: [SRC, c.note].filter(Boolean).join(" · "), lesson_id: ASKED, chatifai_verified: true,
    })))
    .select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  if (!EXTRA) {
    const { error: e3 } = await sb.from("cards").update({ hebrew_meaning: "תפנה / תסתובב", notes: "chatifai: לִףּ (שורש ל.פ.פ) · לִף עַ-(א)לִשְמַאל = תפנה שמאלה" }).eq("translit_nikud", "לִף");
    if (e3) throw e3;
  }
  console.log("✅", data!.length, "cards");
}
// --extra (same day): two more Ariel asked chatifai for
const EXTRA_CARDS: typeof CARDS = [
  { tr: "לַחַדּ מַא תְשוּף", ar: "لحد ما تشوف", he: "עד שתראה", type: "phrase", note: "לאישה: לַחַדּ מַא תְשוּפִי" },
  { tr: "שוּ (א)לְפַרְק?", ar: "شو الفرق؟", he: "מה ההבדל?", type: "phrase", note: "שוּ (א)לְפַרְק בֵּין הַ(אל)כִּלְמְתֵין הַדוֹל? = מה ההבדל בין שתי המילים האלה? · בעיר: פַרְא" },
];
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
