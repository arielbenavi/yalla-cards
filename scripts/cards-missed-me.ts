// "חזרתי, התגעגעת אליי?" and its pieces (Ariel, 2026-10-28). Pointing mine — chatifai was
// down (certificate error) — so chatifai_verified = false until re-checked (open note).
// רְגִ'עְת is spelled as the existing card רִגִ'עֵת (חזרתי), which is moved to מילים שביקשתי.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const C: [string, string, string, string, string][] = [
  ["רִגִ'עֵת, אִשְתַקְתִלִּי?", "رجعت، اشتقتلي؟", "חזרתי, התגעגעת אליי?", "sentence", "לאישה: אִשְתַקְתִילִי? (اشتقتيلي) · בעיר: אִשְתַאְתִלִּי"],
  ["אִשְתַקְתִלִּי?", "اشتقتلي؟", "התגעגעת אליי? (לגבר)", "phrase", "לאישה: אִשְתַקְתִילִי? · מאותו שורש: אִשְתַקְנַאלַכּ = התגעגענו אליך"],
  ["וַחַשְתַכּ?", "وحشتك؟", "חסרתי לך? (התגעגעת אליי?)", "phrase", "מילולית: גרמתי לך בדידות · לאישה: וַחַשְתֵכּ?"],
];
(async () => {
  const { data, error } = await sb.from("cards").insert(C.map(([tr, ar, he, type, notes]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes,
    lesson_id: ASKED, course_verified: false, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  const { count } = await sb.from("cards").update({ lesson_id: ASKED }, { count: "exact" }).eq("arabic_script", "رجعت");
  console.log("✅", data!.length, "new; moved רִגִ'עֵת:", count);
})();
