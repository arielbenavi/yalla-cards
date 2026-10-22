// Words Ariel sent on 2026-10-21, pointed and written in Arabic by chatifai:
//   ג׳חש ("Jah-sh", מטומטם) → גַ'חְש / جحش — literally a donkey foal
//   ג׳יב לאכ (להביא לך)     → גִ'יבְּלַכּ / أجيبلك — short for אַגִ'יבְּלַכּ
//   ע׳דא (צהריים, note b9a792c9) → עַ'דַא / غداء — lunch
//   ג׳וזי (בעלי, 2026-10-22)      → ג'וֹזִי / جوزي — how a woman says "my husband"
//
//   npx tsx scripts/add-ariel-words-2026-10-21.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const WORDS = [
  { translit_nikud: "גַ'חְש", arabic_script: "جحش", hebrew_meaning: "מטומטם", notes: "סלנג, גנאי. מילולית: סייח של חמור", item_type: "word" },
  { translit_nikud: "ג'וֹזִי", arabic_script: "جوزي", hebrew_meaning: "בעלי", notes: "כך אישה אומרת 'בעלי'", item_type: "word" },
  { translit_nikud: "עַ'דַא", arabic_script: "غداء", hebrew_meaning: "ארוחת צהריים", notes: null, item_type: "word" },
  { translit_nikud: "גִ'יבְּלַכּ", arabic_script: "أجيبلك", hebrew_meaning: "להביא לך? / אביא לך", notes: "קיצור של אַגִ'יבְּלַכּ. גִ'יבְּלַכּ קַהְוֵה? = להביא לך קפה?", item_type: "phrase" },
];

async function main() {
  for (const w of WORDS) {
    const { data: existing } = await sb.from("cards").select("id").eq("arabic_script", w.arabic_script);
    if (existing?.length) { console.log(`${w.translit_nikud}: already in the deck`); continue; }
    const { data, error } = await sb.from("cards").insert({ ...w, chatifai_verified: true }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
    console.log(`✅ ${w.translit_nikud} added`, data.id);
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
