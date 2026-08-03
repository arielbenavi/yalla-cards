// Replaces Arabic diacritics that leaked into Hebrew transliteration with their
// Hebrew equivalents.
//
// Arabic shadda (U+0651) and Hebrew dagesh (U+05BC) are visually identical, so
// this is invisible on screen. It is not cosmetic:
//
//   translit_normalized = regexp_replace(translit_nikud, '[֑-ׇ]', '', 'g')
//
// That range is Hebrew marks only. U+0651 survives it, so a card written with
// the Arabic shadda never normalises to the same string as the identical card
// written with the Hebrew dagesh — and the dedup that depends on that column
// silently fails to pair them.
//
// Only fields whose letters are Hebrew are touched. A Hebrew gloss that quotes
// an Arabic word ("נכון (קיצור של صحيح)") is left alone.
//
//   npx tsx scripts/fix-arabic-marks-in-hebrew.ts          # dry run
//   npx tsx scripts/fix-arabic-marks-in-hebrew.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const HEBREW_LETTER = /[א-ת]/;
const ARABIC_LETTER = /[ء-ي]/;

/** Arabic mark → Hebrew mark, for text that is otherwise Hebrew. */
const MARK_MAP: [RegExp, string][] = [
  [/ّ/g, "ּ"], // shadda  → dagesh
  [/َ/g, "ַ"], // fatha   → patah
  [/ُ/g, "ֻ"], // damma   → qubuts
  [/ِ/g, "ִ"], // kasra   → hiriq
  [/ْ/g, "ְ"], // sukun   → shva
];

const fix = (s: string) => MARK_MAP.reduce((acc, [re, to]) => acc.replace(re, to), s);

type Card = { id: string; translit_nikud: string | null; hebrew_meaning: string | null };

async function main() {
  const cards: Card[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, translit_nikud, hebrew_meaning")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    cards.push(...(data as Card[]));
    if (data.length < 1000) break;
  }

  const updates: { id: string; patch: Record<string, string>; before: string; after: string }[] = [];
  for (const c of cards) {
    const patch: Record<string, string> = {};
    let before = "";
    let after = "";
    for (const f of ["translit_nikud", "hebrew_meaning"] as const) {
      const v = c[f];
      if (!v || !HEBREW_LETTER.test(v) || ARABIC_LETTER.test(v)) continue;
      const fixed = fix(v);
      if (fixed === v) continue;
      patch[f] = fixed;
      before ||= v;
      after ||= fixed;
    }
    if (Object.keys(patch).length) updates.push({ id: c.id, patch, before, after });
  }

  for (const u of updates) console.log(`  ${u.id.slice(0, 8)}  ${u.before}`);
  console.log(`\n${updates.length} כרטיסים עם סימנים ערביים בתעתיק העברי`);

  if (!APPLY) {
    console.log("dry run — pass --apply to write");
    return;
  }
  for (const u of updates) {
    const { error } = await sb.from("cards").update(u.patch).eq("id", u.id);
    if (error) throw error;
  }
  console.log(`✅ תוקנו ${updates.length}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
