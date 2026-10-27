// Past-tense verbs from the book's verb tables (Ariel's screenshots, 2026-10-27) as single cards.
// Six already had cards (מפגש 6, never shown): the two whose pointing differs from the table
// (לִעֵבּ, חִ'לֵק) take the book's, עְרֵף gains "הכיר", פַחַצ (בדק) is new next to פַחְצ (בדיקה).
// chatifai was down (404); chatifai_verified = false until re-checked (open note).
// All of them → מילים שביקשתי so they reach the daily queue.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const NEW: [string, string, string][] = [
  ["פַחַצ", "فحص", "בדק"],
  ["עִמֵל", "عمل", "עשה"],
  ["סַרַק", "سرق", "גנב"],
  ["סַמַח", "سمح", "הרשה (נתן רשות)"],
  ["תִעֵבּ", "تعب", "התעייף"],
];
const UPDATE: [string, Record<string, string>][] = [
  ["رفع", {}], ["سمع", {}], ["ضغط", {}], ["حلق", {}],
  ["لعب", { translit_nikud: "לִעֵבּ" }],
  ["خلق", { translit_nikud: "חִ'לֵק" }],
  ["عرف", { hebrew_meaning: "הכיר, ידע, הבין" }],
];
(async () => {
  const { data, error } = await sb.from("cards").insert(NEW.map(([tr, ar, he]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: "word",
    notes: "ספר המדרשה, טבלת פעלים בעבר", lesson_id: ASKED, course_verified: true, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const [ar, patch] of UPDATE) {
    const { error: e3, count } = await sb.from("cards").update({ lesson_id: ASKED, ...patch }, { count: "exact" }).eq("arabic_script", ar);
    if (e3) throw e3;
    console.log(ar, count);
  }
  console.log("✅", data!.length, "new");
})();
