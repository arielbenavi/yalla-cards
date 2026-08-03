// Every card needs a card_srs row or it never appears in review — silently.
//
// This has bitten twice: 199 of 820 cards had no row (including all 82 of
// מפגש בעפ 2), and the same gap exists between verb_conjugations and
// conjugation_srs. Card inserts and SRS inserts are separate statements, so any
// import that forgets the second one loses the content without any error.
//
// Reports only; `scripts/backfill-missing-card-srs.ts` does the writing.
//
//   npx tsx scripts/check-srs-coverage.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

/** Pages past PostgREST's 1000-row default cap. */
async function all<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").trim();

async function main() {
  const cards = await all<{
    id: string;
    lesson_id: string | null;
    item_type: string;
    translit_nikud: string | null;
  }>("cards", "id, lesson_id, item_type, translit_nikud");
  const srs = await all<{ card_id: string }>("card_srs", "card_id");
  const lessons = await all<{ id: string; title: string }>("lessons", "id, title");
  const title = new Map(lessons.map((l) => [l.id, l.title]));

  const withSrs = new Set(srs.map((s) => s.card_id));
  const orphans = cards.filter((c) => !withSrs.has(c.id));

  // An orphan whose word is already in review under another card is clutter,
  // not a gap — the learner still meets the word. Only the rest are invisible.
  // (All 11 orphans as of 2026-08-03 are of the first kind: greetings stored
  // once as `phrase` and again as `sentence`.)
  const reviewed = new Set(
    cards.filter((c) => withSrs.has(c.id)).map((c) => strip(c.translit_nikud ?? ""))
  );
  const invisible = orphans.filter((c) => !reviewed.has(strip(c.translit_nikud ?? "")));
  const shadowed = orphans.length - invisible.length;

  console.log(`כרטיסים: ${cards.length} · עם card_srs: ${withSrs.size}`);
  if (shadowed) {
    console.log(
      `\n⚠️  ${shadowed} כרטיסים בלי card_srs, אבל אותה מילה כבר בחזרה דרך כרטיס אחר — ` +
        `כפילות ולא פער`
    );
  }
  if (invisible.length) {
    const byLesson = new Map<string, number>();
    for (const o of invisible) {
      const k = title.get(o.lesson_id ?? "") ?? "— ללא שיעור —";
      byLesson.set(k, (byLesson.get(k) ?? 0) + 1);
    }
    console.log(`\n❌ ${invisible.length} כרטיסים בלי card_srs — לא יופיעו בחזרה לעולם:`);
    for (const [k, n] of [...byLesson].sort((a, b) => b[1] - a[1])) {
      console.log(`   ${String(n).padStart(4)}  ${k}`);
    }
    console.log("\n   תיקון: npx tsx scripts/backfill-missing-card-srs.ts --apply");
  } else {
    console.log("✅ אין כרטיס שאבד מהחזרה");
  }

  // Same gap on the verb side
  const verbs = await all<{ id: string; root_translit: string | null }>(
    "verb_conjugations",
    "id, root_translit"
  );
  const csrs = await all<{ verb_id: string }>("conjugation_srs", "verb_id");
  const haveC = new Set(csrs.map((c) => c.verb_id));
  const vOrphans = verbs.filter((v) => !haveC.has(v.id));

  console.log(`\nפעלים: ${verbs.length} · עם conjugation_srs: ${haveC.size}`);
  if (vOrphans.length) {
    console.log(`❌ ${vOrphans.length} בלי conjugation_srs:`);
    for (const v of vOrphans.slice(0, 20)) console.log(`   ${v.id}  ${v.root_translit ?? "—"}`);
  } else {
    console.log("✅ לכל פועל יש conjugation_srs");
  }

  if (invisible.length || vOrphans.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
