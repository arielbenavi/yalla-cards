// "עלא טול = מיד" (Ariel, 2026-10-30, book p. 101 / answers p. 304, sentence 7).
// The word card existed (מפגש 4, "מיד לאחר / ישר"): meaning widened to lead with
// מיד, moved to מילים שביקשתי. The sentence is copied from p. 304 with its pointing.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
(async () => {
  const { count } = await sb.from("cards").update({ hebrew_meaning: "מיד; ישר", lesson_id: ASKED }, { count: "exact" }).eq("arabic_script", "على طول");
  const { data, error } = await sb.from("cards").insert({
    translit_nikud: "דַח'לֵת מַע אִבְּנִי (א)לְמַרִיצ' עַ(אל)דֻּכְּתוֹר, פַחַצ (א)לְוַלַד וְכַּשַּף (א)לְמֻשְׁכְּלֵה עַלַא טוּל",
    arabic_script: "دخلت مع ابني المريض عالدكتور، فحص الولد وكشف المشكلة على طول",
    hebrew_meaning: "נכנסתי עם בני החולה לרופא, הוא בדק את הילד וגילה את הבעיה מיד",
    item_type: "sentence", notes: "ספר עמ' 101, תשובות עמ' 304 (משפט 7)",
    lesson_id: ASKED, course_verified: true, chatifai_verified: false,
  }).select("id").single();
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
  if (e2) throw e2;
  console.log("✅ updated עלא טול:", count, "· sentence added");
})();
