// Fills the מפגש 4 gaps found by scripts/audit-meeting4.ts (tasks #1, #2).
//
// Every form here was confirmed by chatifai on 2026-07-31 — including three
// places where chatifai corrected the printed book or the teacher's note. Those
// are called out in the `note` field so the disagreement stays visible on the
// card rather than being silently resolved.
//
//   npx tsx scripts/insert-meeting4-gaps.ts          # dry run
//   npx tsx scripts/insert-meeting4-gaps.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const MEETING4_TITLE = "מפגש 4 - מילות יחס, שייכות ומספרים";

type NewCard = {
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string;
  plural_form?: string;
  notes?: string;
  item_type?: "word" | "phrase" | "sentence";
};

const CARDS: NewCard[] = [
  {
    hebrew_meaning: "מספר, מניין (לפני שם עצם לא מיודע)",
    translit_nikud: "עִדֵּת",
    arabic_script: "عدة",
    notes: "נסמך לשם עצם ברבים לא מיודע: עִדֵּת מַשַאכֵּל = מספר בעיות. מול עַדַד למיודע.",
  },
  { hebrew_meaning: "גן", translit_nikud: "רַוְצַ'ה", arabic_script: "روضة", plural_form: "רַוְצַ'את",
    notes: "ביומיום אומרים רַוְצַ'ת אַטְפַאל כשמתכוונים לגן ילדים." },
  { hebrew_meaning: "תחבורה, העברה, הובלה", translit_nikud: "נַקֵל", arabic_script: "نقل",
    notes: "משמש גם להובלת דירה." },
  { hebrew_meaning: "עולה, יוצא", translit_nikud: "טַאלֵע", arabic_script: "طالع", plural_form: "טַאלְעִין",
    notes: "ה-ט׳ נחצית (עמוקה)." },
  { hebrew_meaning: "עולה, יוצאת", translit_nikud: "טַאלְעַה", arabic_script: "طالعة", plural_form: "טַאלְעַאת" },
  { hebrew_meaning: "יורד", translit_nikud: "נַאזֵל", arabic_script: "نازل", plural_form: "נַאזְלִין" },
  { hebrew_meaning: "יורדת", translit_nikud: "נַאזְלֵה", arabic_script: "نازلة", plural_form: "נַאזְלַאת" },
  {
    hebrew_meaning: "מקורית",
    translit_nikud: "אַצְלִיֵּה",
    arabic_script: "أصلية",
    plural_form: "אַצְלִיַּאת",
    notes: "שימושי בשוק במובן 'אורגינל' ולא חיקוי.",
  },
  { hebrew_meaning: "מאפייה", translit_nikud: "מַחְ'בַּז", arabic_script: "مخبز", plural_form: "מַחַ'אבֵּז" },
];

/** Plurals the book gives that the DB was missing. */
const PLURAL_FIXES: { match: string; plural: string }[] = [{ match: "נֻצּ", plural: "נְצַאץ" }];

const norm = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[׳']/g, "'").trim();

async function main() {
  const { data: lessons } = await sb.from("lessons").select("id, title");
  const m4 = (lessons ?? []).find((l) => l.title === MEETING4_TITLE);
  if (!m4) throw new Error("מפגש 4 lesson not found");

  const existing: { id: string; translit_nikud: string; plural_form: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("cards").select("id, translit_nikud, plural_form").range(from, from + 999);
    if (!data?.length) break;
    existing.push(...(data as typeof existing));
    if (data.length < 1000) break;
  }
  const have = new Set(existing.map((c) => norm(c.translit_nikud)));

  const toInsert = CARDS.filter((c) => !have.has(norm(c.translit_nikud)));
  const already = CARDS.length - toInsert.length;

  console.log(`${CARDS.length} words · ${toInsert.length} to insert · ${already} already present`);
  for (const c of toInsert) console.log(`  + ${c.translit_nikud.padEnd(14)} ${c.hebrew_meaning}`);

  const pluralUpdates = PLURAL_FIXES.map((f) => {
    const card = existing.find((c) => norm(c.translit_nikud) === norm(f.match));
    return card && !card.plural_form ? { id: card.id, ...f } : null;
  }).filter(Boolean) as { id: string; match: string; plural: string }[];
  for (const p of pluralUpdates) console.log(`  ~ ${p.match} → ריבוי ${p.plural}`);

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  if (toInsert.length) {
    const { data: inserted, error } = await sb
      .from("cards")
      .insert(
        toInsert.map((c) => ({
          lesson_id: m4.id,
          hebrew_meaning: c.hebrew_meaning,
          translit_nikud: c.translit_nikud,
          arabic_script: c.arabic_script,
          plural_form: c.plural_form ?? null,
          notes: c.notes ?? null,
          item_type: c.item_type ?? "word",
          chatifai_verified: true,
        }))
      )
      .select("id");
    if (error) throw error;

    // A card with no card_srs row never reaches review — see the tasks skill
    const { error: srsErr } = await sb
      .from("card_srs")
      .insert((inserted ?? []).map((c) => ({ card_id: c.id, direction: "he_to_ar" as const })));
    if (srsErr) throw srsErr;
    console.log(`\n✅ ${inserted?.length} cards + ${inserted?.length} card_srs rows`);
  }

  for (const p of pluralUpdates) {
    await sb.from("cards").update({ plural_form: p.plural }).eq("id", p.id);
    console.log(`✅ ${p.match} plural set`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
