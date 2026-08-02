// One-off repair: simulation_doctor turn 4 is the branch point, and I filled it.
//
// A turn carrying `options` is blank on purpose — the learner picks from the
// options and the parent cell holds nothing. All 15 dialogues are built that
// way. On 2026-08-02 a "missing line" fix wrote translit/ar/he onto that turn,
// which left it with both a fixed line and 2 options. This strips the three
// fields back off; the options were never touched.
//
//   npx tsx scripts/revert-doctor-turn4.ts          # dry run
//   npx tsx scripts/revert-doctor-turn4.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

type Turn = { speaker?: string; translit?: string; ar?: string; he?: string; options?: unknown[] };

async function main() {
  const { data: row, error } = await sb
    .from("paradigms")
    .select("id, data")
    .eq("slug", "simulation_doctor")
    .single();
  if (error || !row) throw error ?? new Error("simulation_doctor not found");

  const data = row.data as { turns: Turn[] };
  const turns: Turn[] = structuredClone(data.turns);

  let fixed = 0;
  for (const [i, t] of turns.entries()) {
    if (!t.options?.length) continue;
    if (!t.translit && !t.ar && !t.he) continue;

    console.log(`תור ${i + 1} — ${t.options.length} אפשרויות, אבל גם טקסט קבוע:`);
    console.log(`  translit: ${t.translit}`);
    console.log(`  ar:       ${t.ar}`);
    console.log(`  he:       ${t.he}`);
    delete t.translit;
    delete t.ar;
    delete t.he;
    fixed++;
  }

  if (!fixed) {
    console.log("אין תורות בחירה עם טקסט קבוע — כלום לתקן");
    return;
  }
  if (!APPLY) {
    console.log(`\n${fixed} תור(ים) — dry run, pass --apply to write`);
    return;
  }

  const { error: upErr } = await sb
    .from("paradigms")
    .update({ data: { ...data, turns } })
    .eq("id", row.id);
  if (upErr) throw upErr;
  console.log(`\n✅ הוחזר ${fixed} תור`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
