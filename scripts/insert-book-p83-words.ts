// Words/chunks from the pp. 83–84 answers (pp. 300–301) that had no card (2026-10-25),
// pointed by chatifai. Into מילים שביקשתי so they reach the daily queue.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const C: [string, string, string, string][] = [
  ["עְמוּמִי", "عمومي", "הדודים שלי (מצד אבא)", "word"],
  ["צַלַאת (א)לְעַצֵר", "صلاة العصر", "תפילת אחר הצהריים", "phrase"],
  ["קַלְבּ (א)לְמַדִינֵה", "قلب المدينة", "מרכז העיר (מילולית: לב העיר)", "phrase"],
  ["דַאר (א)לְאַיְתַאם", "دار الأيتام", "בית יתומים", "phrase"],
  ["מֻדִיר חְסַאבַּאת", "مدير حسابات", "מנהל חשבונות", "phrase"],
  ["מַלַאן", "ملان", "מלא", "word"],
  ["גֻ'וַּת", "جوات", "בתוך", "word"],
  ["עַלַא כֻּלּ חַאל", "على كل حال", "על כל מצב / בכל מקרה", "phrase"],
  ["מַלִיש נַפְס", "ماليش نفس", "אין לי חשק", "phrase"],
  ["אִסְמוֹ", "اسمه", "השם שלו", "word"],
];
(async () => {
  const { data, error } = await sb.from("cards").insert(C.map(([tr, ar, he, type]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type,
    notes: "ספר המדרשה עמ׳ 300–301", lesson_id: ASKED, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "cards");
})();
