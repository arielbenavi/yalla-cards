// Every audited dialogue so far has had ض transliterated as ד׳ instead of צ׳ —
// four for four. That is a systematic property of whatever generated them, not
// four coincidences, so it is worth finding mechanically instead of waiting for
// chatifai to reach each dialogue.
//
// Heuristic: flag a turn whose Arabic contains ض while its transliteration
// contains ד׳. ذ legitimately maps to ד׳ (אַחַ׳ד׳), so a turn containing ذ is
// reported separately rather than auto-flagged.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Cell = { translit?: string; ar?: string; he?: string };
type Turn = Cell & { speaker?: string; options?: Cell[] };

const DALET_GERESH = /ד[֑-ׇ]*['׳]/;

async function main() {
  const { data } = await sb
    .from("paradigms")
    .select("slug, data")
    .like("slug", "simulation_%")
    .order("slug");

  let certain = 0;
  let ambiguous = 0;

  for (const row of data ?? []) {
    const d = row.data as { turns?: Turn[]; chatifai_verified?: boolean };
    const verified = d.chatifai_verified === true;
    const hits: string[] = [];

    for (const t of d.turns ?? []) {
      for (const cell of [t, ...(t.options ?? [])]) {
        if (!cell.translit || !cell.ar) continue;
        if (!cell.ar.includes("ض")) continue;
        if (!DALET_GERESH.test(cell.translit)) continue;

        // ذ also maps to ד׳, so a turn with both letters is ambiguous
        const hasThal = cell.ar.includes("ذ");
        if (hasThal) {
          ambiguous++;
          hits.push(`    ? ${cell.translit}\n      ${cell.ar}  (יש גם ذ — צריך בדיקה ידנית)`);
        } else {
          certain++;
          hits.push(`    ✗ ${cell.translit}\n      ${cell.ar}`);
        }
      }
    }

    if (hits.length) {
      console.log(`\n■ ${row.slug}${verified ? " (מאומת)" : ""} — ${hits.length}`);
      for (const h of hits) console.log(h);
    }
  }

  console.log(`\nודאיים: ${certain} · דו-משמעיים: ${ambiguous}`);
  if (certain === 0) console.log("✅ אין שגיאות ض שנותרו");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
