// מפגש 5 personal practice (pp. 81–82), answer key pp. 298–299, as drills in
// התאמת הטיות (2026-10-25). Read off the page images; chatifai checked every cell —
// its one real catch, אִנְתִי in the negation table (מַלִכְּש, מַעִכְּש), was confirmed
// against the image at 7x. Bracketed variants stay; the drill shows the main form.
//
//   npx tsx scripts/insert-meeting-5-answer-tables.ts [--apply]
// Rollback: delete from paradigms where meeting = 5 and slug in ('answers_298', 'answers_299_negation');
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const P = ["אַנַא", "אִנְתֵ", "אִנְתִי", "הֻוֵّ", "הִיֵّ", "אִחְנַא", "אִנְתוּ", "הֵםّ"];
const A: [string, string, string, string, string][] = [
  // tabaa, taa, ili, ind, maa
  ["תַבַּעִי", "תַעִי", "אִלִי", "עִנְדִי", "מַעִי (מַעַאיְ)"],
  ["תַבַּעַכּ", "תַעַכּ", "אִלַכּ", "עִנְדַכּ", "מַעַכּ (מַעַאכּ)"],
  ["תַבַּעֵכּ", "תַעֵכּ", "אִלֵכּ", "עִנְדֵכּ", "מַעֵכּ (מַעַאכִּי)"],
  ["תַבַּעוֹ", "תַעוֹ", "אִלוֹ", "עִנְדוֹ", "מַעוֹ (מַעַאה)"],
  ["תַבַּעַא", "תַעַא", "אִלְהַא", "עִנְדְהַא", "מַעַא (מַעַאהַא)"],
  ["תַבַּעְנַא", "תַעְנַא", "אִלְנַא", "עִנַּא", "מַעְנַא (מַעַאנַא)"],
  ["תַבַּעְכֹּם", "תַעְכֹּם", "אִלְכֹּם", "עִנְדְכֹּם", "מַעְכֹּם (מַעַאכֹּם)"],
  ["תַבַּעְהֹם", "תַעְהֹם", "אִלְהֹם", "עִנְדְהֹם", "מַעְהֹם (מַעַאהֹם)"],
];
const B: [string, string, string][] = [
  ["מַלִיש (מַא אִלִיש)", "מַא עִנְדִיש", "מַעִיש (מַא מַעִיש)"],
  ["מַלַכְּש (מַא אִלַכְּש)", "מַא עִנְדַכְּש", "מַעַכְּש (מַא מַעַכְּש)"],
  ["מַלִכְּש (מַא אִלִכְּש)", "מַא עִנְדֵכְּש", "מַעִכְּש (מַא מַעִכְּש)"],
  ["מַלוֹש (מַא אִלוֹש)", "מַא עִנְדוֹש", "מַעוֹש (מַא מַעוֹש)"],
  ["מַלְהַאש (מַא אִלְהַאש)", "מַא עִנְדְהַאש", "מַעְהַאש (מַא מַעְהַאש)"],
  ["מַלְנַאש (מַא אִלְנַאש)", "מַא עִנַּאש (עִנְדְנַאש)", "מַעְנַאש (מַא מַעְנַאש)"],
  ["מַלְכֹּמְש (מַא אִלְכֹּמְש)", "מַא עִנְדְכֹּמְש", "מַעְכֹּמְש (מַא מַעְכֹּמְש)"],
  ["מַלְהֹמְש (מַא אִלְהֹמְש)", "מַא עִנְדְהֹמְש", "מַעְהֹמְש (מַא מַעְהֹמְש)"],
];
const rows = [
  { meeting: 5, slug: "answers_298", data: {
    description: "פתרון התרגול האישי — מפגש 5 (עמ' 81, פתרון בעמ' 298)", course_verified: true,
    translations: { tabaa: "תַבַּע — של", taa: "תַע — של (קצר)", ili: "אִל — יש ל..", ind: "עִנְד — אצל / יש ל..", maa: "מַע — עם / עליי" },
    rows: A.map(([tabaa, taa, ili, ind, maa], i) => ({ person: P[i], tabaa, taa, ili, ind, maa })) } },
  { meeting: 5, slug: "answers_299_negation", data: {
    description: "פתרון הטייה בשלילה (מַא + __ + ש) — מפגש 5 (עמ' 82, פתרון בעמ' 299)", course_verified: true,
    translations: { ili: "אִל בשלילה — אין ל..", ind: "עִנְד בשלילה — אין אצל..", maa: "מַע בשלילה — אין עליי" },
    rows: B.map(([ili, ind, maa], i) => ({ person: P[i], ili, ind, maa })) } },
];
(async () => {
  console.log(rows.map((r) => `${r.slug}: ${r.data.rows.length}`).join(", "));
  if (!APPLY) return console.log("dry run");
  const { error } = await sb.from("paradigms").upsert(rows, { onConflict: "meeting,slug" });
  if (error) throw error;
  console.log("✅ upserted");
})();
