// Book exercises from pages 26–27, 31–33 (+ 289–292), 36–37, 40–41, 44–45 and 50 (+ 294) as drills
// (Ariel, 2026-10-23). Data and sources: scripts/data/book-translation-drills.ts.
//
// - six translation drills → paradigms rows with data.type = "translation_drill",
//   served by /api/translation-drill to /translate
// - the second noun-suffix table (p. 32 / 290) → paradigms 2 / noun_suffixes_2,
//   picked up by התאמת הטיות next to the first (p. 31, already in)
//
// No cards, no FSRS: drills only.
//
//   npx tsx scripts/insert-book-translation-drills.ts [--apply]
// Rollback: delete from paradigms where slug in ('book_dialogue_p26',
//   'book_translation_p33', 'book_construct_p36', 'book_prepositions_p40', 'book_dialogue_p44', 'book_translation_p50', 'noun_suffixes_2');
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { DRILLS, NOUN_SUFFIXES_2 } from "./data/book-translation-drills";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

const ARABIC_SHADDA = /ّ/;

async function main() {
  const rows = DRILLS.map((d) => ({
    meeting: d.meeting,
    slug: d.slug,
    data: { type: "translation_drill", title: d.title, source: d.source, dir: d.dir, course_verified: true, items: d.items },
  }));

  const { columns, head, table } = NOUN_SUFFIXES_2;
  rows.push({
    meeting: 2,
    slug: "noun_suffixes_2",
    data: {
      description: "המשך הטיית מילים — סיומות שייכות, מפגש 2 (עמ' 32, פתרון עמ' 290)",
      source: "עמ' 32, פתרון בעמ' 290 (המדרשה לערבית וביטחון)",
      course_verified: true,
      translations: head,
      rows: table.map(([person, ...forms]) => ({ person, ...Object.fromEntries(columns.map((c, i) => [c, forms[i]])) })),
    } as never,
  });

  // The Arabic shadda belongs only on the person labels (as in noun_suffixes)
  for (const d of DRILLS) for (const it of d.items) if (ARABIC_SHADDA.test(it.ar)) throw new Error(`shadda in ${d.slug} #${it.num}`);
  for (const r of table) for (const f of r.slice(1)) if (ARABIC_SHADDA.test(f)) throw new Error(`shadda in ${f}`);

  for (const r of rows) {
    const d = r.data as { items?: unknown[]; rows?: unknown[] };
    console.log(`${r.meeting} ${r.slug}: ${d.items?.length ?? d.rows?.length}`);
  }
  if (!APPLY) return console.log("\ndry run — add --apply");
  const { error } = await sb.from("paradigms").upsert(rows, { onConflict: "meeting,slug" });
  if (error) throw error;
  console.log("✅ upserted", rows.length);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
