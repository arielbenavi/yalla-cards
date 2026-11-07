// Ariel (2026-11-07): a word for "late" and the exchange about the teacher who is
// always late. Palestinian: مِتْأَخِّر (late), verb اتأخّر, habitual بضلّو يتأخّر.
// اخوت here is "fool, nutcase" (أهوت), not "brother" as ChatGPT had it. The
// transliteration follows how Ariel heard it (بوصل בּוֹצַל). chatifai is down:
// chatifai_verified=false. Adds a lesson, cards and each new card's card_srs row.
//
//   npx tsx scripts/insert-late-2026-11-07.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fixBet } from "../lib/word-lookup";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const ITEMS: { ar: string; tr: string; he: string; type: "word" | "sentence"; notes?: string }[] = [
  { ar: "متأخّر", tr: "מִתְאַחֵּ'ר", he: "מאחר, באיחור", type: "word", notes: "פועל: اتأخّر אִתְאַחַּ'ר — איחר. نِتْأَخَّر — נאחר" },
  { ar: "المعلّم المجنون بوصل متأخّر عشرين دقيقة", tr: "אִלְמְעַלֶּם אִלְמַגְ'נוּן בּוֹצַל מִתְאַחֵּ'ר עִשְרִין דַקִיקַה", he: "המורה המשוגע מגיע באיחור של עשרים דקות", type: "sentence" },
  { ar: "آه يا زلمة، اخوت هذا", tr: "אַה, יַא זַלַמֶה, אַחְ'וַת הַאדַא", he: "אה בנאדם, הוא מטורף / טיפש", type: "sentence", notes: "اخوت — טיפש, מטורף (לא 'אח')" },
  { ar: "بضلّو يتأخّر", tr: "בִּצַ'לּוֹ יִתְאַחַּ'ר", he: "הוא כל הזמן מאחר", type: "sentence", notes: "ضلّ + פועל — ממשיך / כל הזמן" },
];

async function main() {
  if (!process.argv.includes("--apply")) return console.log("dry run — add --apply");
  const { data: lesson, error } = await sb.from("lessons").insert({ title: "מילים שביקשתי 7.11.26", date: "2026-11-07" }).select("id").single();
  if (error) throw error;
  for (const i of ITEMS) {
    const { data: card, error: e1 } = await sb
      .from("cards")
      .insert({ arabic_script: i.ar, translit_nikud: fixBet(i.tr), hebrew_meaning: i.he, notes: i.notes ?? null, item_type: i.type, lesson_id: lesson.id, chatifai_verified: false })
      .select("id")
      .single();
    if (e1) throw e1;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log("✅ lesson", lesson.id, "·", ITEMS.length, "cards");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
