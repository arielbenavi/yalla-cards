// Writes the chatifai-verified Palestinian paradigms into verb_conjugations.
//
// Upserts on `root`, so a verb that already exists (from the 0013 MSA seed) is
// corrected rather than duplicated. Also overwrites the flat `forms` column with
// the Palestinian present tense, so the current /inflections screen stops showing
// the Modern Standard Arabic forms the seed put there.
//
// A verb carrying entries in `flags` — a cell still awaiting chatifai
// confirmation — is written with chatifai_verified = false.
//
//   npx tsx scripts/write-verb-paradigms.ts          # dry run
//   npx tsx scripts/write-verb-paradigms.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { VERBS, type Person } from "./data/verb-paradigms";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const PERSONS: Person[] = ["ana", "inta", "inti", "huwwe", "hiyye", "ihna", "intu", "hum"];

function validate() {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const v of VERBS) {
    if (seen.has(v.root)) problems.push(`duplicate root ${v.root}`);
    seen.add(v.root);
    for (const p of PERSONS) {
      for (const tense of ["past", "present"] as const) {
        const f = v[tense][p];
        if (!f?.translit || !f?.arabic) problems.push(`${v.root} ${tense}.${p} incomplete`);
        // A Hebrew letter in the Arabic column means a bad paste, not a real form
        if (/[֐-׿]/.test(f?.arabic ?? "")) {
          problems.push(`${v.root} ${tense}.${p} arabic contains Hebrew: ${f.arabic}`);
        }
      }
    }
    for (const p of ["inta", "inti", "intu"] as const) {
      const f = v.imperative[p];
      if (!f?.translit || !f?.arabic) problems.push(`${v.root} imperative.${p} incomplete`);
      if (/[֐-׿]/.test(f?.arabic ?? "")) {
        problems.push(`${v.root} imperative.${p} arabic contains Hebrew: ${f.arabic}`);
      }
    }
  }
  return problems;
}

async function main() {
  const problems = validate();
  if (problems.length) {
    console.error("❌ validation failed:");
    for (const p of problems) console.error("   " + p);
    process.exit(1);
  }
  console.log(`✅ ${VERBS.length} verbs pass validation`);

  const flagged = VERBS.filter((v) => v.flags?.length);
  if (flagged.length) {
    console.log(`\n⚠  ${flagged.length} verb(s) have unconfirmed cells → chatifai_verified = false`);
    for (const v of flagged) for (const f of v.flags!) console.log(`   ${v.root}: ${f}`);
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  for (const v of VERBS) {
    // Flat `forms` keeps the shape the current /inflections screen reads
    const forms: Record<string, string> = {};
    for (const p of PERSONS) forms[p] = v.present[p].arabic;

    const row = {
      root: v.root,
      root_translit: v.root_translit,
      meaning_he: v.meaning_he,
      forms,
      forms_full: {
        past: v.past,
        present: v.present,
        imperative: v.imperative,
        ...(v.participle ? { participle: v.participle } : {}),
      },
      notes: [v.binyan, v.notes].filter(Boolean).join(" · ") || null,
      chatifai_verified: !v.flags?.length,
      dialect: "palestinian",
    };

    const { error } = await sb.from("verb_conjugations").upsert(row, { onConflict: "root" });
    if (error) throw new Error(`${v.root}: ${error.message}`);
    console.log(`  ✅ ${v.root.padEnd(8)} ${v.root_translit.padEnd(12)} ${v.meaning_he}`);
  }

  // A newly upserted verb has no conjugation_srs rows, and nothing creates them
  // on read — same gap that left 138 cards out of the review queue. Backfill the
  // three tracks 0012 defines. Additive: existing rows are left alone.
  const { data: allVerbs } = await sb.from("verb_conjugations").select("id, root");
  const { data: existing } = await sb.from("conjugation_srs").select("verb_id, track");
  const has = new Set((existing ?? []).map((r) => `${r.verb_id}:${r.track}`));

  const tracks = ["recognition", "production", "audio"] as const;
  const missing = (allVerbs ?? []).flatMap((v) =>
    tracks.filter((t) => !has.has(`${v.id}:${t}`)).map((track) => ({ verb_id: v.id, track }))
  );

  if (missing.length) {
    const { error } = await sb.from("conjugation_srs").insert(missing);
    if (error) throw error;
    console.log(`\n✅ created ${missing.length} conjugation_srs rows for new verbs`);
  }

  const { count } = await sb
    .from("verb_conjugations")
    .select("id", { count: "exact", head: true })
    .eq("chatifai_verified", true);
  console.log(`\n${VERBS.length} verbs written · ${count} chatifai_verified in table`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
