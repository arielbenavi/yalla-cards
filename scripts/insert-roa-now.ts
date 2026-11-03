// Ariel: Roa's words for "now" never came up. The combined card from Preply Roa K. 1 was
// skipped at insert because אִסַא and הַלַּא already existed, as new cards buried in
// old lessons. The daily queue serves the newest lesson first, so this card gets a lesson
// of today's date: it comes up with today's new cards. No existing card or FSRS row changes.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const TITLE = "מילים לתרגול מיידי";
const ARABIC = "اسا / هلأ / هسه";
(async () => {
  const { data: had } = await sb.from("cards").select("id").eq("arabic_script", ARABIC);
  if (had?.length) return console.log("already there", had[0].id);
  const { data: lesson, error } = await sb.from("lessons").insert({ title: TITLE, date: "2026-11-03", source: "other" }).select("id").single();
  if (error) throw error;
  const { data: card, error: e2 } = await sb.from("cards").insert({
    translit_nikud: "אִסַּא / הַלַּא / הַסַּה", arabic_script: ARABIC, hebrew_meaning: "עכשיו (במקום הַלְקֵית)", item_type: "word",
    notes: "Preply · Roa · אִסַּא — בגליל ובמשולש; הַלַּא — עירוני; הַסַּה — כפרי וירדני",
    lesson_id: lesson.id, course_verified: false, chatifai_verified: false,
  }).select("id").single();
  if (e2) throw e2;
  const { error: e3 } = await sb.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
  if (e3) throw e3;
  console.log("✅", card.id);
})();
