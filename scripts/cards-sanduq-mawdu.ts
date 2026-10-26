// Ariel, 2026-10-26: a card for תיבה, and מַוְצ'וּע = נושא, מצב.
// The תיבה card existed as the urban צַנְדוּא (never reviewed); it becomes the book's
// צַנְדוּק with the urban form in the note — one card, not two. Both move into
// מילים שביקשתי so they reach the daily queue. Text and lesson only; no FSRS field.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
(async () => {
  const a = await sb.from("cards").update({
    translit_nikud: "צַנְדוּק", arabic_script: "صندوق", hebrew_meaning: "תיבה / קופה",
    notes: "ספר המדרשה עמ׳ 79, 301 · ר: צַנַאדִיק · בעירונית: צַנְדוּא · גֻ'וַּת (אל)צַּנְדוּק = בתוך התיבה",
    lesson_id: ASKED,
  }).eq("id", "2f550249-8604-4bf3-8364-9f9c4cb10184");
  if (a.error) throw a.error;
  const b = await sb.from("cards").update({ hebrew_meaning: "נושא / מצב", lesson_id: ASKED }).eq("id", "2448cb97-bf78-42a6-be30-fd3ed1ade85f");
  if (b.error) throw b.error;
  console.log("✅ צַנְדוּק, מַוְצ'וּע");
})();
