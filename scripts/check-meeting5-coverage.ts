// What of מפגש 5 is already in the database, and what is genuinely new.
//
// Run this before sending anything to chatifai — there is no point asking it to
// vocalise words that already have verified cards.
//
//   npx tsx scripts/check-meeting5-coverage.ts
//   npx tsx scripts/check-meeting5-coverage.ts --new   # just the new ones
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  BOOK_VOCAB,
  NOTES_VOCAB,
  COLOURS,
  COLOURS_EXTRA,
  COLOUR_ADJECTIVES,
  type Vocab,
} from "./data/meeting5";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const ONLY_NEW = process.argv.includes("--new");
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const known = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb
      .from("cards")
      .select("translit_nikud, hebrew_meaning, item_type")
      .range(from, from + 999);
    if (!data?.length) break;
    for (const c of data) {
      if (c.item_type !== "word") continue;
      known.set(strip(c.translit_nikud ?? ""), c.hebrew_meaning ?? "");
    }
    if (data.length < 1000) break;
  }

  const colourWords: Vocab[] = [
    ...COLOURS.flatMap((c) => [
      { translit: c.m, he: c.he, source: "book" as const },
      { translit: c.f, he: `${c.he} (נ)`, source: "book" as const },
      { translit: c.pl, he: `${c.he} (ר)`, source: "book" as const },
    ]),
    ...COLOURS_EXTRA.filter((c) => c.m).map((c) => ({
      translit: c.m,
      he: c.he,
      source: "book" as const,
    })),
    ...COLOUR_ADJECTIVES,
  ];

  const groups: [string, Vocab[]][] = [
    ["אוצר מילים מהספר", BOOK_VOCAB],
    ["צבעים", colourWords],
    ["מההערות של אריאל", NOTES_VOCAB],
  ];

  let newTotal = 0;
  for (const [label, list] of groups) {
    const missing = list.filter((v) => !known.has(strip(v.translit)));
    const have = list.length - missing.length;
    newTotal += missing.length;
    console.log(`\n### ${label} — ${list.length} סה"כ · ${have} קיימים · ${missing.length} חדשים\n`);
    for (const v of missing) {
      const flag = v.needsNikud ? " ⚠️ בלי ניקוד" : "";
      console.log(`  ${v.translit.padEnd(20)} ${v.he}${flag}`);
    }
    if (!ONLY_NEW && have) {
      const existing = list.filter((v) => known.has(strip(v.translit)));
      console.log(`\n  כבר קיימים: ${existing.map((v) => v.translit).join(" · ")}`);
    }
  }

  const needNikud = NOTES_VOCAB.filter(
    (v) => v.needsNikud && !known.has(strip(v.translit))
  ).length;
  console.log(`\n${newTotal} כרטיסים חדשים · ${needNikud} מהם צריכים ניקוד מ-chatifai`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
