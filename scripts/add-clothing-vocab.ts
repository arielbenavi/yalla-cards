// Clothing words chatifai gave unprompted while answering whether قميص means
// specifically a buttoned shirt (it does — بلوزة is the word for a t-shirt).
//
// Every row here is exactly what chatifai printed: its Arabic, its pointed
// transliteration, its gloss. Nothing is filled in from elsewhere.
//
// DELIBERATELY OMITTED — chatifai did not give a complete pair for either:
//   מעיל כבד — it said כַּבּוּת is the common word but never printed its Arabic,
//     and gave معطف as "less common" with no transliteration.
//   the ورا inflections (וַרַאי, וַרַאכּ, וַרַאה …) — transliterations only, no
//     Arabic script per form. Those belong in the prepositions paradigm anyway.
// Both are queued as questions rather than guessed.
//
//   npx tsx scripts/add-clothing-vocab.ts          # dry run
//   npx tsx scripts/add-clothing-vocab.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const WORDS = [
  {
    translit_nikud: "בְּלוּזֵה",
    arabic_script: "بلوزة",
    hebrew_meaning: "חולצה (לא מכופתרת) / טי-שירט",
    notes: "chatifai: המילה הנפוצה ביומיום לכל חולצה שאינה מכופתרת, להבדיל מ-قميص",
  },
  { translit_nikud: "פַאנִילַה", arabic_script: "فانيلة", hebrew_meaning: "גופייה" },
  { translit_nikud: "גַ'רְזַאיֵה", arabic_script: "جرزاية", hebrew_meaning: "סוודר / סריג" },
  { translit_nikud: "גַ'אכֵּית", arabic_script: "جاكيت", hebrew_meaning: "ג'קט / מעיל קל" },
  { translit_nikud: "אַוַאעִי", arabic_script: "أواعي", hebrew_meaning: "בגדים (כללי)" },
];

async function main() {
  const { data: existing } = await sb
    .from("cards")
    .select("id, arabic_script")
    .in("arabic_script", WORDS.map((w) => w.arabic_script));
  const have = new Set((existing ?? []).map((c) => c.arabic_script));

  const toAdd = WORDS.filter((w) => !have.has(w.arabic_script));
  for (const w of WORDS) {
    const mark = have.has(w.arabic_script) ? "כבר קיים" : "יתווסף  ";
    console.log(`  ${mark}  ${w.translit_nikud.padEnd(14)} ${w.arabic_script.padEnd(10)} ${w.hebrew_meaning}`);
  }
  if (!toAdd.length) {
    console.log("\nכלום להוסיף");
    return;
  }
  console.log(`\n${toAdd.length} להוספה`);
  if (!APPLY) {
    console.log("dry run — pass --apply to write");
    return;
  }

  for (const w of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({ ...w, item_type: "word", chatifai_verified: true })
      .select("id")
      .single();
    if (error) throw error;
    // Without a card_srs row the card never appears in review.
    const { error: e2 } = await sb
      .from("card_srs")
      .insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
    console.log(`✅ ${data.id.slice(0, 8)}  ${w.translit_nikud}`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
