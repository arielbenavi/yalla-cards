// 199 cards had no card_srs row, so they could never appear in review at all —
// including all 82 cards of מפגש בעפ 2. Card inserts and their card_srs inserts
// live in separate statements across the API and the one-off scripts, and when
// the second one is skipped the card is silently invisible.
//
// This backfills the missing rows, skipping any card whose normalised translit
// already belongs to a card that IS in review (those are genuine re-entries of
// the same word across lessons, not gaps).
//
// Additive only: it creates card_srs rows in the default New state and never
// touches an existing row, review_log, or self_score.
//
//   npx tsx scripts/backfill-missing-card-srs.ts          # dry run
//   npx tsx scripts/backfill-missing-card-srs.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const strip = (s: string) => s.replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

async function pageAll<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  const cards = await pageAll<{
    id: string;
    hebrew_meaning: string;
    translit_nikud: string;
    lesson_id: string | null;
  }>("cards", "id, hebrew_meaning, translit_nikud, lesson_id");
  const srs = await pageAll<{ card_id: string }>("card_srs", "card_id");
  const { data: lessons } = await sb.from("lessons").select("id, title");
  const title = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  const have = new Set(srs.map((s) => s.card_id));
  const liveTranslits = new Set(
    cards.filter((c) => have.has(c.id)).map((c) => strip(c.translit_nikud))
  );

  const orphans = cards.filter((c) => !have.has(c.id));
  const skipped = orphans.filter((o) => liveTranslits.has(strip(o.translit_nikud)));
  const toCreate = orphans.filter((o) => !liveTranslits.has(strip(o.translit_nikud)));

  const byLesson: Record<string, number> = {};
  for (const c of toCreate) {
    const k = title.get(c.lesson_id ?? "") ?? "—";
    byLesson[k] = (byLesson[k] ?? 0) + 1;
  }

  console.log(`cards ${cards.length} · card_srs ${srs.length} · orphans ${orphans.length}`);
  console.log(`  skipped (same word already in review): ${skipped.length}`);
  console.log(`  to create: ${toCreate.length}`);
  console.log(byLesson);

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  const rows = toCreate.map((c) => ({ card_id: c.id, direction: "he_to_ar" as const }));
  const { data: created, error } = await sb.from("card_srs").insert(rows).select("id");
  if (error) throw error;

  // Record the new ids so this is trivially revertible
  const path = `/tmp/backfill-card-srs-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(path, JSON.stringify((created ?? []).map((r) => r.id), null, 2));
  console.log(`\n✅ created ${created?.length} card_srs rows`);
  console.log(`   ids written to ${path} (delete those ids to revert)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
