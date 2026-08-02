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

/** Corrections that apply to every dialogue, not one line of one of them.
 *  شقل appears in zero cards — only in these generated dialogues — which is
 *  itself more evidence they did not come through the same pipeline. chatifai
 *  gives شيكل / שֵׁיכֵּל as the form actually used. */
const GLOBAL_WORDS: [string, string][] = [
  ["شقل", "شيكل"],
  ["שֵׁקֶל", "שֵׁיכֵּל"],
];

// Nikud combining marks come back from Postgres in a different normalisation
// than a TS source literal, so identical-looking strings compare unequal.
const norm = (s: string) => s.normalize("NFC");

/** Pass 1: mechanical corrections that need no per-dialogue audit, applied to
 *  EVERY simulation dialogue. ض written as ד׳ turned up in four out of four
 *  audited dialogues, so it is a property of the generator, not a coincidence —
 *  waiting for chatifai to reach each dialogue would leave known-wrong text
 *  sitting there. This does not mark anything verified. */
async function applyGlobalWordFixes(): Promise<number> {
  const { data } = await sb
    .from("paradigms")
    .select("id, slug, data")
    .like("slug", "simulation_%");

  let changed = 0;
  for (const row of data ?? []) {
    const d = row.data as { turns?: Turn[] };
    const turns: Turn[] = structuredClone(d.turns ?? []);
    let touched = false;

    for (const t of turns) {
      for (const cell of [t, ...(t.options ?? [])]) {
        for (const [from, to] of [...DAD_WORDS, ...GLOBAL_WORDS]) {
          for (const field of ["translit", "ar", "he"] as const) {
            const v = cell[field];
            if (v?.includes(from)) {
              cell[field] = v.split(from).join(to);
              console.log(`  ${row.slug}: ${from} → ${to}`);
              touched = true;
              changed++;
            }
          }
        }
      }
    }

    if (touched && APPLY) {
      const { error } = await sb
        .from("paradigms")
        .update({ data: { ...(row.data as object), turns } })
        .eq("id", row.id);
      if (error) throw error;
    }
  }
  return changed;
}

async function main() {
  let totalChanges = 0;

  console.log("■ תיקונים מכניים לכל הדו-שיחים");
  const globalChanges = await applyGlobalWordFixes();
  console.log(`  ${globalChanges} change(s)\n`);
  totalChanges += globalChanges;

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
    // The global word pass rewrites stored text after a per-dialogue fix landed
    // (שֵׁקֶל → שֵׁיכֵּל), so the fix's literal target no longer appears. Compare
    // against the globally-corrected form or already-applied fixes read as drift.
    const globalized = (s: string) => {
      let out = s;
      for (const [from, to] of [...DAD_WORDS, ...GLOBAL_WORDS]) out = out.split(from).join(to);
      return norm(out);
    };
    const presentGlobalized = new Set([...present].map((p) => globalized(p)));
    for (const f of dialogue.fixes) {
      if (!f.to.translit) continue;
      if (present.has(norm(f.to.translit)) || presentGlobalized.has(globalized(f.to.translit))) {
        unmatched.delete(f.match);
      }
    }

    for (const t of turns) {
      for (const cell of [t, ...(t.options ?? [])]) {
        // A blank cell is a missing line, not a line with nothing wrong with it —
        // simulation_doctor turn 4 was empty in all three columns. Only a fix
        // whose match is "" may target one; everything below needs real text.
        if (!cell.translit) {
          const blankFix = dialogue.fixes.find((f) => f.match === "");
          if (blankFix) {
            unmatched.delete("");
            applied.push(`  (שורה ריקה)\n    → ${blankFix.to.translit}\n    ${blankFix.reason}`);
            Object.assign(cell, blankFix.to);
          }
          continue;
        }

        for (const fix of dialogue.fixes) {
          if (!fix.match) continue;
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

        for (const [from, to] of GLOBAL_WORDS) {
          for (const field of ["translit", "ar", "he"] as const) {
            const v = cell[field];
            if (v?.includes(from)) {
              cell[field] = v.split(from).join(to);
              applied.push(`  ${v}\n    → ${cell[field]}\n    ${from} → ${to} (chatifai)`);
            }
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
      ...(dialogue.notes?.length ? { verification_notes: dialogue.notes } : {}),
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
