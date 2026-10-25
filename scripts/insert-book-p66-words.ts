// Words from the p. 66–67 / 296–297 answers that had no card (2026-10-24),
// pointed by chatifai. Into מילים שביקשתי so they reach the daily queue.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const CARDS = process.argv.includes("--hatta") ? [
  // (later, same day) וְחַתַּא = ואפילו, confirmed by chatifai
  { translit_nikud: "וְחַתַּא", arabic_script: "وحتى", hebrew_meaning: "ואפילו", item_type: "word",
    notes: "ספר המדרשה עמ׳ 296 · כֻּלּ (אל)נַּאס בִּיעְרַפוּ, וְחַתַּא (א)לְאַטְפַאל = כל האנשים יודעים, ואפילו הילדים · אפילו לא: וַלַא" },
] : [
  { translit_nikud: "גִ'יל", arabic_script: "جيل", hebrew_meaning: "דור", item_type: "word", notes: "ספר המדרשה עמ׳ 297 · גִ'יל (אל)שַּבַּאבּ = דור הצעירים" },
  { translit_nikud: "טַלְעַה", arabic_script: "طلعة", hebrew_meaning: "עלייה (בדרך)", item_type: "word", notes: "ספר המדרשה עמ׳ 297 · ההפך: נַזְלֵה = ירידה" },
  { translit_nikud: "צַלַאת (אל)צֻּ'הֻר", arabic_script: "صلاة الظهر", hebrew_meaning: "תפילת הצהריים", item_type: "phrase", notes: "ספר המדרשה עמ׳ 296 · chatifai" },
  { translit_nikud: "צַלַאת (א)לְמַעְ'רֵב", arabic_script: "صلاة المغرب", hebrew_meaning: "תפילת בין הערביים", item_type: "phrase", notes: "ספר המדרשה עמ׳ 297" },
  { translit_nikud: "בַּאבּ (א)לְעַאמוּד", arabic_script: "باب العامود", hebrew_meaning: "שער שכם (מילולית: שער העמוד)", item_type: "phrase", notes: "ספר המדרשה עמ׳ 296" },
];
(async () => {
  const { data, error } = await sb.from("cards").insert(CARDS.map((c) => ({ ...c, lesson_id: ASKED, course_verified: true, chatifai_verified: true }))).select("id, translit_nikud");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const d of data!) console.log("✅", d.translit_nikud);
})();
