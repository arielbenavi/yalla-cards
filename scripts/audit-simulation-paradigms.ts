// Audits the 15 simulation_* rows in `paradigms` — the conversation dialogues
// that note a4e6b161 is about. Nothing in the app reads them yet, and they carry
// no verification flag, so this reports size and any drift from the conventions
// the (chatifai-verified) cards table established.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Cell = { translit?: string; ar?: string; he?: string };
type Turn = Cell & { speaker?: string; options?: Cell[] };

const GERESH = /[׳'"]/;
const hasDaletGeresh = (s: string) => /ד[֑-ׇ]*/.test(s) && GERESH.test(s.replace(/[^ד׳'"]/g, ""));

async function main() {
  const { data } = await sb.from("paradigms").select("slug, data").like("slug", "simulation_%");

  let totalTurns = 0;
  let choicePoints = 0;
  let dadTurns = 0;
  let dalet = 0;
  let tsade = 0;
  const examples: string[] = [];

  for (const row of data ?? []) {
    const turns: Turn[] = (row.data as { turns?: Turn[] })?.turns ?? [];
    for (const t of turns) {
      if (t.options?.length) choicePoints++;
      for (const c of [t, ...(t.options ?? [])]) {
        if (!c.translit) continue;
        totalTurns++;
        if (c.ar && /ض/.test(c.ar)) {
          dadTurns++;
          // ض is written צ׳ throughout the cards table; ד׳ marks content that
          // did not come through the same pipeline.
          const d = /ד[֑-ׇ]*[׳'"]/.test(c.translit);
          const ts = /צ[֑-ׇ]*[׳'"]/.test(c.translit);
          if (d) {
            dalet++;
            if (examples.length < 8) examples.push(`${row.slug}: ${c.translit}`);
          } else if (ts) tsade++;
        }
      }
    }
  }

  console.log(`simulations: ${(data ?? []).length}`);
  console.log(`total turns (incl. options): ${totalTurns}`);
  console.log(`multiple-choice decision points: ${choicePoints}`);
  console.log(`\nturns whose Arabic contains ض: ${dadTurns}`);
  console.log(`  transliterated ד׳: ${dalet}   צ׳: ${tsade}`);
  if (examples.length) {
    console.log(`\ndiverging from the cards convention (צ׳):`);
    for (const e of examples) console.log("  " + e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
