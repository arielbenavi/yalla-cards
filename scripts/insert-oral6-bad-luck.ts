// Creates the lesson "מפגש בעל פה 6" (Tomer, the Minerva story "המזל הרע") and inserts its cards.
// Pointing is mine (chatifai is down), so chatifai_verified = false until re-checked.
// Skipped as already in the deck: אַרְצ' (أرض), כִּלְמֵה (كلمة).
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CARDS } from "./data/oral6-bad-luck";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const SKIP = new Set(["أرض", "كلمة"]);
(async () => {
  const { data: lesson, error: e0 } = await sb.from("lessons").insert({
    date: "2026-10-28", title: "מפגש בעל פה 6", source: "oral", teacher: "תומר", meeting: 6,
    notes: "הסיפור המזל הרע (الحظ العاطل) של מינרוה: https://youtu.be/6QubRNusq_g",
  }).select("id").single();
  if (e0) throw e0;
  const rows = CARDS.filter(([, ar]) => !SKIP.has(ar));
  const { data, error } = await sb.from("cards").insert(rows.map(([tr, ar, he, type, notes]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: lesson.id, course_verified: false, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅ lesson", lesson.id, "·", data!.length, "cards");
})();
