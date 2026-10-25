// Words Ariel asked for (2026-10-24), forms from chatifai (chat 6ada9c7bcab92323ed0bd261),
// into מילים שביקשתי so they reach the daily queue.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const CARDS = [
  { translit_nikud: "מַוְקֵף סַיַּארַאת", arabic_script: "موقف سيارات", hebrew_meaning: "חניון מכוניות", item_type: "phrase",
    notes: "chatifai · החניון: מַוְקֵף (א)לְסַיַּארַאת · ברחוב גם: כַּרַאג', בַּארְכִּינְג · בעיר: מַוְאֵף" },
  { translit_nikud: "נַקְלַאת", arabic_script: "نقلات", hebrew_meaning: "נגלות / הובלות", item_type: "word",
    notes: "chatifai · יחיד: נַקְלֵה · עִמִלְנַא תַלַת נַקְלַאת = עשינו שלוש נגלות" },
  { translit_nikud: "דֻעְ'רִי בַּעְד צַלַאתִ (א)לְפַגְ'ר", arabic_script: "دغري بعد صلاة الفجر", hebrew_meaning: "מיד אחרי תפילת השחר", item_type: "phrase",
    notes: "chatifai · דֻעְ'רִי = ישר (בדרך) וגם מיד (בזמן)" },
];
(async () => {
  const { data, error } = await sb.from("cards").insert(CARDS.map((c) => ({ ...c, lesson_id: ASKED, chatifai_verified: true }))).select("id, translit_nikud");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const d of data!) console.log("✅", d.translit_nikud);
})();
