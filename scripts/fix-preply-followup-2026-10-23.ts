// Ariel, 2026-10-23, after the Preply lesson:
// - עַלַא מַא יֻרַאם (book p. 44 dialogue, line 5) as a card. The book's pointing,
//   read at 5x; chatifai reviewed the line, confirmed the kubutz in יֻרַאם, and said
//   in speech it merges to עַאמַא יֻרַאם — kept in the notes.
// - רֻחֵת → רֻחִת, chatifai's pointing (Yazeed's "Rohit"). Old form in the notes.
// - וַאגִ'בּ: chatifai's word on homework added to the note.
// Card text only; no FSRS field is touched.
//
//   npx tsx scripts/fix-preply-followup-2026-10-23.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282"; // מילים שביקשתי — in the daily queue

async function main() {
  const { data: rh } = await sb.from("cards").select("id, notes").eq("translit_nikud", "רֻחֵת").single();
  const { data: wj } = await sb.from("cards").select("id, notes").eq("translit_nikud", "וַאגִ'בּ").single();
  console.log("רֻחֵת:", rh?.id, "| וַאגִ'בּ:", wj?.id);
  if (!APPLY || !rh || !wj) return console.log("dry run — add --apply");

  const { data: c, error } = await sb
    .from("cards")
    .insert({
      translit_nikud: "עַלַא מַא יֻרַאם",
      arabic_script: "على ما يرام",
      hebrew_meaning: "כמו שצריך / כשורה",
      notes: "ספר המדרשה עמ׳ 44 · כֻּלּ שִי עַלַא מַא יֻרַאם = הכל מעולה · chatifai: בדיבור מתחבר ל-עַאמַא יֻרַאם",
      item_type: "phrase",
      lesson_id: ASKED,
      course_verified: true,
      chatifai_verified: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: e1 } = await sb.from("card_srs").insert({ card_id: c.id, direction: "he_to_ar" });
  if (e1) throw e1;

  const { error: e2 } = await sb
    .from("cards")
    .update({ translit_nikud: "רֻחִת", notes: [rh.notes, "chatifai: רֻחִת (קודם: רֻחֵת) · Preply · יזיד: Rohit"].filter(Boolean).join(" · "), chatifai_verified: true })
    .eq("id", rh.id);
  if (e2) throw e2;

  const { error: e3 } = await sb
    .from("cards")
    .update({ notes: `${wj.notes} · chatifai: وَاجِب זו "חובה" במובן הכללי; לשיעורי בית ספר הקורס משתמש בדרך כלל ב-وظيفة (וַטִ'יפֵה)` })
    .eq("id", wj.id);
  if (e3) throw e3;
  console.log("✅ עַלַא מַא יֻרַאם added, רֻחִת updated, וַאגִ'בּ note");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
