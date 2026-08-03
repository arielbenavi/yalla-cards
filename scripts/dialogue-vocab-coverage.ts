// How much of each simulation dialogue is built from words Ariel actually has?
//
// Note a4e6b161 asks for simulations derived from the card set rather than
// generated freely. Before rebuilding anything it is worth knowing how far the
// existing dialogues already are from that: a dialogue at 80% coverage needs a
// few cards added, one at 30% is teaching vocabulary that was never introduced.
//
// Matching is on the stripped transliteration — nikud varies between a card and
// a dialogue line for the same word, and `translit_normalized` already exists
// for exactly this reason.
//
//   npx tsx scripts/dialogue-vocab-coverage.ts           # summary
//   npx tsx scripts/dialogue-vocab-coverage.ts --missing # list unknown words
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const SHOW_MISSING = process.argv.includes("--missing");

/** Strip nikud, the definite article, and the clitics that attach in writing. */
const strip = (w: string) =>
  w
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[.,?!״"'’—…]/g, "")
    .replace(/^[ובלכשמ]?-?(?:אל|אִל|א)-/, "")
    .trim();

const tokenize = (line: string) =>
  line
    .split(/[\s־]+/)
    .map(strip)
    .filter((w) => w.length > 1);

async function main() {
  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (!data?.length) break;
    for (const c of data) {
      // Phrases contribute each of their words, not just the whole string.
      for (const w of tokenize(c.translit_nikud ?? "")) known.add(w);
    }
    if (data.length < 1000) break;
  }

  const { data: rows } = await sb
    .from("paradigms")
    .select("slug, data")
    .like("slug", "simulation_%");

  const results: { slug: string; pct: number; missing: string[]; total: number }[] = [];

  for (const r of rows ?? []) {
    const d = r.data as { turns?: Record<string, unknown>[] };
    const words = new Set<string>();
    for (const t of d.turns ?? []) {
      const cells = [t, ...(((t.options as Record<string, unknown>[]) ?? []))];
      for (const c of cells) for (const w of tokenize((c.translit as string) ?? "")) words.add(w);
    }
    const missing = [...words].filter((w) => !known.has(w));
    const total = words.size;
    results.push({
      slug: r.slug,
      total,
      missing,
      pct: total ? Math.round(((total - missing.length) / total) * 100) : 0,
    });
  }

  results.sort((a, b) => b.pct - a.pct);
  console.log(`${known.size} מילים מוכרות מהכרטיסים\n`);
  for (const r of results) {
    const bar = "█".repeat(Math.round(r.pct / 5)).padEnd(20, "░");
    console.log(
      `  ${bar} ${String(r.pct).padStart(3)}%  ${r.slug.replace("simulation_", "").padEnd(20)} ` +
        `${r.total - r.missing.length}/${r.total}`
    );
    if (SHOW_MISSING && r.missing.length) {
      console.log(`      חסר: ${r.missing.slice(0, 25).join(" · ")}`);
    }
  }

  const avg = Math.round(results.reduce((n, r) => n + r.pct, 0) / (results.length || 1));
  console.log(`\nכיסוי ממוצע: ${avg}%`);

  // A word missing from one dialogue is that dialogue's problem; a word missing
  // from eight is the cheapest card to add.
  const freq = new Map<string, number>();
  for (const r of results) for (const w of r.missing) freq.set(w, (freq.get(w) ?? 0) + 1);
  const shared = [...freq.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);

  console.log(`\nמילים חסרות שחוזרות ביותר מדו-שיח אחד — ${shared.length}:`);
  for (const [w, n] of shared.slice(0, 30)) {
    console.log(`  ${String(n).padStart(2)} דו-שיחים  ${w}`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
