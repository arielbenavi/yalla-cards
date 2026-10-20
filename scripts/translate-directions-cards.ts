// The two הכוונה בדרך cards had "הכוונה בדרך — פסקה 1/2" as their meaning, so
// the Hebrew side of the card was a label, not something to translate from.
// The meaning is now chatifai's full translation (2026-10-20); the label moves
// to the front of `notes` so the card still says where it comes from.
//
//   npx tsx scripts/translate-directions-cards.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

const TRANSLATIONS: { id: string; label: string; he: string }[] = [
  {
    id: "c31702f8-b32a-4a63-9178-7ae661fda985",
    label: "הכוונה בדרך — פסקה 1",
    he: "כשאתה יוצא מהבית שלך, קח ימינה ותלך ישר על המדרכה שהצבע שלה לבן ושחור. כשתראה את צומת הדרכים, תפנה שמאלה. שם יש תנועת מכוניות רבה לפניך. דרך אגב, אחר כך תרד בירידה עד שתגיע למרפאה שהצבע שלה ירוק.",
  },
  {
    id: "a6565b6c-520b-493b-8d3a-c8e5b22d41cc",
    label: "הכוונה בדרך — פסקה 2",
    he: "אחר כך, תלך ישר עד שתראה עץ גדול. דרך אגב, אין שם רמזור, אבל יש כיכר קטנה.",
  },
];

async function main() {
  for (const t of TRANSLATIONS) {
    const { data: c, error } = await sb.from("cards").select("hebrew_meaning, notes").eq("id", t.id).single();
    if (error) throw error;
    if (c.hebrew_meaning !== t.label) {
      console.log(`⏭ ${t.label}: meaning is already "${c.hebrew_meaning.slice(0, 40)}"`);
      continue;
    }
    const notes = [t.label, c.notes].filter(Boolean).join(" · ");
    console.log(`${t.label}\n   → ${t.he}\n   notes: ${notes}`);
    if (APPLY) {
      const { error: e } = await sb.from("cards").update({ hebrew_meaning: t.he, notes }).eq("id", t.id);
      if (e) throw e;
    }
  }
  console.log(APPLY ? "✅ written" : "dry run — add --apply");
}
main().catch((e) => { console.error(e); process.exit(1); });
