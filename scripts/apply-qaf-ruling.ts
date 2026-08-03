// Applies chatifai's ق ruling to the cards, word by word.
//
// This is the one script on the project that rewrites text on cards Ariel has
// already memorised, so it is built to be undone:
//   - dry run by default; --apply is required to write
//   - every write is preceded by a full JSON backup of the affected rows
//   - --revert <backup.json> puts the old values back verbatim
//
// Matching is token-level and exact, mirroring scripts/list-qaf-words.ts: the
// 83-word list was derived by splitting translit_nikud on whitespace, so the
// same split is what makes the rulings addressable. Anything that does not match
// a ruled token exactly is left alone and reported — a near-miss is a word
// chatifai never saw, not a word to guess at.
//
//   npx tsx scripts/apply-qaf-ruling.ts                    # dry run
//   npx tsx scripts/apply-qaf-ruling.ts --apply
//   npx tsx scripts/apply-qaf-ruling.ts --revert backups/qaf-1234.json
import { config } from "dotenv";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ALL_RULINGS, CONFLICTS, BLOCKERS } from "./data/qaf-ruling";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const revertIdx = process.argv.indexOf("--revert");
const REVERT = revertIdx >= 0 ? process.argv[revertIdx + 1] : null;

/** דַקִיקַה got two different forms in two rounds — held back until re-confirmed. */
const HELD = new Set(["דַקִיקַה", "דְּקִיקַה"]);

const PUNCT = /[.,?!״"'’]/g;
const norm = (s: string) => s.normalize("NFC");

const map = new Map<string, string>();
for (const r of ALL_RULINGS) {
  if (r.keeps_qaf || r.from === r.to) continue;
  if (HELD.has(r.from)) continue;
  map.set(norm(r.from), norm(r.to));
}

type Card = { id: string; translit_nikud: string | null };

async function fetchCards(): Promise<Card[]> {
  const out: Card[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, translit_nikud")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

/** Replaces ruled tokens in place, keeping the original spacing and punctuation. */
function convert(text: string): { next: string; hits: string[]; unmatched: string[] } {
  const hits: string[] = [];
  const unmatched: string[] = [];
  const next = norm(text).replace(/[^\s־]+/g, (tok) => {
    if (!tok.includes("ק")) return tok;
    const bare = tok.replace(PUNCT, "");
    const to = map.get(bare);
    if (!to) {
      if (!HELD.has(bare)) unmatched.push(bare);
      return tok;
    }
    hits.push(`${bare} → ${to}`);
    return tok.replace(bare, to);
  });
  return { next, hits, unmatched };
}

async function revert(path: string) {
  const rows: { id: string; translit_nikud: string }[] = JSON.parse(readFileSync(path, "utf8"));
  if (!APPLY) {
    console.log(`${rows.length} שורות ישוחזרו מ-${path}\ndry run — הוסף --apply`);
    return;
  }
  for (const r of rows) {
    const { error } = await sb
      .from("cards")
      .update({ translit_nikud: r.translit_nikud })
      .eq("id", r.id);
    if (error) throw error;
  }
  console.log(`↩️  שוחזרו ${rows.length} כרטיסים`);
}

async function main() {
  if (REVERT) return revert(REVERT);

  const cards = await fetchCards();
  const changes: { id: string; before: string; after: string; hits: string[] }[] = [];
  const unmatched = new Map<string, number>();

  for (const c of cards) {
    if (!c.translit_nikud?.includes("ק")) continue;
    const { next, hits, unmatched: miss } = convert(c.translit_nikud);
    for (const m of miss) unmatched.set(m, (unmatched.get(m) ?? 0) + 1);
    if (next !== norm(c.translit_nikud)) {
      changes.push({ id: c.id, before: c.translit_nikud, after: next, hits });
    }
  }

  console.log(`${changes.length} כרטיסים ישתנו · ${map.size} מילים מומרות\n`);
  for (const c of changes) {
    console.log(`  ${c.before}`);
    console.log(`→ ${c.after}`);
    console.log(`  (${c.hits.join(" · ")})\n`);
  }

  if (unmatched.size) {
    console.log(`\n⚠️  ${unmatched.size} מילים עם ק שאין להן פסק — לא נגענו בהן:`);
    for (const [w, n] of [...unmatched].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(3)}× ${w}`);
    }
  }

  if (HELD.size) console.log(`\n⏸  מוחזק עד לאישור חוזר: ${[...HELD].join(", ")}`);
  if (CONFLICTS.length) console.log(`\nסתירות פתוחות:\n  - ${CONFLICTS.join("\n  - ")}`);

  if (!APPLY) {
    console.log(`\nחסמים:\n  - ${BLOCKERS.join("\n  - ")}`);
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  mkdirSync("backups", { recursive: true });
  const path = `backups/qaf-${Date.now()}.json`;
  writeFileSync(path, JSON.stringify(changes.map((c) => ({ id: c.id, translit_nikud: c.before })), null, 2));
  console.log(`\nגיבוי: ${path}`);

  for (const c of changes) {
    const { error } = await sb.from("cards").update({ translit_nikud: c.after }).eq("id", c.id);
    if (error) throw error;
  }
  console.log(`✅ עודכנו ${changes.length} כרטיסים · לשחזור: npx tsx scripts/apply-qaf-ruling.ts --revert ${path} --apply`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
