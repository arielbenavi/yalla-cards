// Structural scan of every simulation_* dialogue.
//
// Checks the shape rather than the Arabic.
//
// A turn that carries `options` is SUPPOSED to be blank — it is the branch
// point, the learner picks from the options, and the parent cell holds no text.
// Every dialogue has exactly one. Reporting those as gaps is what led to
// simulation_doctor's branch turn being "repaired" with a fixed line, which
// broke the choice; so a blank branch turn is correct here, and a branch turn
// that has BOTH options and text is the actual defect.
//
//   - non-branch turns with an empty or missing translit / ar / he
//   - branch turns that also carry fixed text
//   - options blocks that are empty or have a single choice
//
//   npx tsx scripts/scan-dialogue-gaps.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Cell = { translit?: string; ar?: string; he?: string; options?: Cell[] };

const blank = (s?: string) => !s || !s.trim();

async function main() {
  const { data, error } = await sb.from("paradigms").select("slug, data").like("slug", "simulation_%");
  if (error) throw error;

  let problems = 0;
  for (const row of data ?? []) {
    const d = row.data as { turns?: Cell[]; chatifai_verified?: boolean };
    const turns = d.turns ?? [];
    const found: string[] = [];

    turns.forEach((t, i) => {
      const isBranch = !!t.options?.length;
      const cells: [string, Cell][] = isBranch ? [] : [[`תור ${i + 1}`, t]];
      (t.options ?? []).forEach((o, j) => cells.push([`תור ${i + 1} אפשרות ${j + 1}`, o]));

      for (const [label, c] of cells) {
        const missing = (["translit", "ar", "he"] as const).filter((f) => blank(c[f]));
        if (missing.length === 3) found.push(`${label}: ריק לגמרי`);
        else if (missing.length) found.push(`${label}: חסר ${missing.join(", ")}`);
      }

      // A branch turn must hold no text of its own, or the UI has a fixed line
      // and a choice at the same time.
      if (isBranch) {
        const stray = (["translit", "ar", "he"] as const).filter((f) => !blank(t[f]));
        if (stray.length) found.push(`תור ${i + 1}: תור בחירה עם טקסט קבוע (${stray.join(", ")})`);
      }

      if (t.options && t.options.length === 1) found.push(`תור ${i + 1}: רק אפשרות אחת`);
      if (t.options && t.options.length === 0) found.push(`תור ${i + 1}: options ריק`);
    });

    if (!turns.length) found.push("אין turns בכלל");

    const mark = d.chatifai_verified ? "✅" : "  ";
    if (found.length) {
      problems += found.length;
      console.log(`${mark} ${row.slug} — ${found.length} בעיות`);
      for (const f of found) console.log(`      ${f}`);
    } else {
      console.log(`${mark} ${row.slug} — תקין מבנית (${turns.length} תורות)`);
    }
  }

  console.log(`\n${problems} בעיות מבניות`);
  if (problems) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
