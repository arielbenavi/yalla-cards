// Applies chatifai's audited corrections to the stored simulation_* dialogues
// and marks each audited row verified, so /api/dialogues will serve it.
//
// Replaces the one-off scripts/verify-simulation-shawarma.ts; add new dialogues
// to scripts/data/dialogue-fixes.ts as chatifai clears them.
//
//   npx tsx scripts/apply-dialogue-fixes.ts          # dry run
//   npx tsx scripts/apply-dialogue-fixes.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { DIALOGUE_FIXES } from "./data/dialogue-fixes";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

type Cell = { translit?: string; ar?: string; he?: string };
type Turn = Cell & { speaker?: string; options?: Cell[] };

// ض is written צ׳ throughout the cards table; these dialogues drifted to ד׳.
// ذ keeps ד׳ (אַחַ׳ד׳), so this maps only the specific words chatifai settled.
const DAD_WORDS: [string, string][] = [["תְפַדַּ'ל", "תְפַצַּ'ל"], ["פַאדִי", "פַאצִ'י"]];

// Nikud combining marks come back from Postgres in a different normalisation
// than a TS source literal, so identical-looking strings compare unequal.
const norm = (s: string) => s.normalize("NFC");

async function main() {
  let totalChanges = 0;

  for (const dialogue of DIALOGUE_FIXES) {
    const { data: row, error } = await sb
      .from("paradigms")
      .select("id, data")
      .eq("slug", dialogue.slug)
      .single();
    if (error || !row) {
      console.warn(`⚠ ${dialogue.slug} not found`);
      continue;
    }

    const turns: Turn[] = structuredClone((row.data as { turns: Turn[] }).turns);
    const applied: string[] = [];
    const unmatched = new Set(dialogue.fixes.map((f) => f.match));

    // Idempotent: a fix whose target text is already present has been applied by
    // an earlier run, so it is satisfied rather than missing.
    const present = new Set(
      turns.flatMap((t) => [t, ...(t.options ?? [])]).map((c) => norm(c.translit ?? ""))
    );
    for (const f of dialogue.fixes) {
      if (f.to.translit && present.has(norm(f.to.translit))) unmatched.delete(f.match);
    }

    for (const t of turns) {
      for (const cell of [t, ...(t.options ?? [])]) {
        if (!cell.translit) continue;

        for (const fix of dialogue.fixes) {
          if (norm(cell.translit) === norm(fix.match)) {
            unmatched.delete(fix.match);
            applied.push(`  ${fix.match}\n    → ${fix.to.translit ?? cell.translit}\n    ${fix.reason}`);
            Object.assign(cell, fix.to);
          }
        }

        for (const [from, to] of DAD_WORDS) {
          if (cell.translit.includes(from)) {
            const before = cell.translit;
            cell.translit = cell.translit.split(from).join(to);
            applied.push(`  ${before}\n    → ${cell.translit}\n    ض is צ׳ in the cards table, not ד׳`);
          }
        }
      }
    }

    console.log(`\n■ ${dialogue.slug} — ${applied.length} change(s)`);
    for (const a of applied) console.log(a);
    for (const m of unmatched) console.error(`  ❌ no line matched: ${m}`);
    if (unmatched.size) {
      throw new Error(`${dialogue.slug}: ${unmatched.size} fix(es) matched nothing — data drifted`);
    }
    totalChanges += applied.length;

    if (!APPLY) continue;

    const newData = {
      ...(row.data as object),
      turns,
      chatifai_verified: !dialogue.flags?.length,
      verified_at: new Date().toISOString().slice(0, 10),
      verification_note: dialogue.verdict,
      ...(dialogue.flags?.length ? { verification_flags: dialogue.flags } : {}),
    };
    const { error: upErr } = await sb.from("paradigms").update({ data: newData }).eq("id", row.id);
    if (upErr) throw upErr;
    console.log(`  ✅ written, chatifai_verified = ${!dialogue.flags?.length}`);
  }

  console.log(`\n${totalChanges} change(s) across ${DIALOGUE_FIXES.length} dialogue(s)`);
  if (!APPLY) console.log("dry run — pass --apply to write");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
