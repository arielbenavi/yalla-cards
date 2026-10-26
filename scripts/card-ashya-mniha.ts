// Book p. 301: אַשְיַאא מְנִיחַה = דברים טובים as its own card (Ariel, 2026-10-26).
// Pointing as in מַלַאנֵה בְּאַשְיַאא מְנִיחַה (p. 301, already checked by chatifai).
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
(async () => {
  const { data, error } = await sb.from("cards").insert({
    translit_nikud: "אַשְיַאא מְנִיחַה", arabic_script: "أشياء منيحة", hebrew_meaning: "דברים טובים", item_type: "phrase",
    notes: "ספר המדרשה עמ׳ 301 · בְּאַשְיַאא מְנִיחַה = בדברים טובים", lesson_id: ASKED, course_verified: true, chatifai_verified: true,
  }).select("id").single();
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
  if (e2) throw e2;
  console.log("✅ אַשְיַאא מְנִיחַה");
})();
