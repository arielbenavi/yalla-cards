/**
 * Inserts the ~10 missing/extra vocab words from meeting 2 oral session.
 * Nikud verified by chatifai (response 2026-07-30).
 * Notes:
 *   - "סנא=ביחד" → chatifai says מַע בַּעַד is the correct PA form (already in DB);
 *     added סַוַא as alternative
 *   - "בתעלה" → chatifai says it's בִּתְעַלַּם (to learn/study)
 *   - "הודו=עיז'ל" → עִגֵ'ל = עגל/בשר עגל; "הודו" = turkey in Arabic (דִיכּ חַבַּשׁ)
 *   - "מן שופו תלפיזיון" → chatifai says it's בִּנְשׁוּף = "אנחנו רואים"
 * Run: npx tsx scripts/insert-meeting2-extra-vocab.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const LESSON_ID = "5325a7b7-82e9-446c-ac41-d913690d52dd"; // שיעור 2

function strip(s: string) {
  return s.replace(/[֑-ׇ]/g, "").trim();
}

const words: Array<{ he: string; translit: string; ar: string }> = [
  // "סנא=ביחד" → chatifai: correct PA is מַע בַּעַד (already in DB). סַוַא also used.
  { he: "ביחד (גם: סַוַא)", translit: "סַוַא", ar: "سوا" },
  // "בתעלה" → chatifai: בִּתְעַלַּם = לומד
  { he: "לומד", translit: "בִּתְעַלַּם", ar: "بتعلم" },
  // "ביל ישראל ביל ברה"
  { he: "בישראל או בחוץ לארץ", translit: "בִּיִשְׂרַאאִיל אַוְ בִּל-בַּרַּא", ar: "بإسرائيل أو بالبرا" },
  // טניס
  { he: "טניס", translit: "תֵנִס", ar: "تنس" },
  // אכל אסיאוי
  { he: "אוכל אסייתי", translit: "אַכֵּל אַסְיַאוִי", ar: "أكل آسياوي" },
  // שו בתחיב תאכול
  { he: "מה אתה אוהב לאכול?", translit: "שׁוּ בִּתְחִבּ תָאכֻּל?", ar: "شو بتحب تاكل؟" },
  // הודו=עיז'ל → chatifai: עִגֵ'ל = עגל/בשר עגל
  { he: "עגל / בשר עגל", translit: "עִגֵ'ל", ar: "عجل" },
  // עילא ליקה (להתראות — פורמלי)
  { he: "להתראות (ביטוי פורמלי)", translit: "אִלַא אִל-לִקַאא", ar: "إلى اللقاء" },
  // פתגם: הרטוב לא מפחד מהגשם
  { he: "הרטוב לא מפחד מהגשם (פתגם)", translit: "אִל-מַבְּלוּל מַא בִּיחַ'אף מִן אִל-מַטַר", ar: "المبلول ما بيخاف من المطر" },
  // מן שופו תלפיזיון → chatifai: בִּנְשׁוּף תִלְפִזְיוֹן = אנחנו רואים טלוויזיה
  { he: "אנחנו רואים טלוויזיה", translit: "בִּנְשׁוּף תִלְפִזְיוֹן", ar: "بنشوف تلفزيون" },
];

async function main() {
  const { data: existing } = await sb
    .from("cards")
    .select("translit_nikud")
    .eq("item_type", "word")
    .eq("lesson_id", LESSON_ID);

  const existingSet = new Set((existing ?? []).map((c: any) => strip(c.translit_nikud)));

  const toInsert = words
    .filter((w) => !existingSet.has(strip(w.translit)))
    .map((w) => ({
      lesson_id: LESSON_ID,
      hebrew_meaning: w.he,
      translit_nikud: w.translit,
      arabic_script: w.ar,
      item_type: "word",
      chatifai_verified: true,
    }));

  if (toInsert.length === 0) {
    console.log("no new word cards to insert (all already exist)");
    return;
  }

  const { data, error } = await sb.from("cards").insert(toInsert).select("id");
  if (error) { console.error("insert error:", error); return; }
  console.log(`✓ inserted ${data?.length} word cards into שיעור 2`);
  for (const w of words) {
    const isNew = !existingSet.has(strip(w.translit));
    console.log(`  ${isNew ? "NEW " : "skip"} ${w.translit} = ${w.he}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
