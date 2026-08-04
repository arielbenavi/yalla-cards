// What of מפגש 5 is already in the database, and what is genuinely new.
//
// Written before the chatifai pass, to avoid asking it to vocalise words that
// already had cards. That made it compare the **book's own spellings** against
// the cards — which is now wrong, because what went into the database is
// chatifai's corrected form, not the book's.
//
// Left as-is it reported 36 words missing, including משקפיים, which is present
// as נַצַّ'ארַאת while the book writes נַצַّארַאת. Every book entry is therefore
// resolved through its correction in meeting5-verified.ts (`was`) before being
// called missing.
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
import { NOTES, COLOURS as V_COLOURS, COLOURS_EXTRA as V_EXTRA, BOOK } from "./data/meeting5-verified";
import { REMAINDER, HELD_ON_QAF } from "./data/meeting5-remainder";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const ONLY_NEW = process.argv.includes("--new");
// Arabic marks have to come out too, not just Hebrew ones. The book transcription
// carries Arabic shadda U+0651 where the cards carry Hebrew dagesh U+05BC — they
// render identically, so stripping only [֑-ׇ] left טַיֵّבּ and טַיֵּבּ comparing
// unequal and reported nine words as missing that were sitting right there.
const strip = (s: string) =>
  s
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ًٌٍَُِّْٰ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function main() {
  // book spelling → the corrected spelling chatifai gave for it
  const corrected = new Map<string, string>();
  for (const v of [...NOTES, ...V_EXTRA, ...BOOK] as { translit: string; was?: string }[]) {
    if (v.was) corrected.set(strip(v.was), strip(v.translit));
  }
  for (const c of V_COLOURS as unknown as { translit: string; was?: string }[]) {
    if (c.was) corrected.set(strip(c.was), strip(c.translit));
  }
  for (const v of REMAINDER) if (v.was) corrected.set(strip(v.was), strip(v.translit));

  // Ruled, but deliberately not inserted until the ق convention is decided —
  // reported separately so they do not read as work still to be done.
  const heldOnQaf = new Set(
    HELD_ON_QAF.flatMap((v) => [strip(v.translit), ...(v.was ? [strip(v.was)] : [])])
  );

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
    // Covered if the book form itself has a card, or the correction does.
    const covered = (v: { translit: string }) => {
      const k = strip(v.translit);
      return known.has(k) || known.has(corrected.get(k) ?? "\u0000");
    };
    const missing = list.filter((v) => !covered(v) && !heldOnQaf.has(strip(v.translit)));
    const held = list.filter((v) => heldOnQaf.has(strip(v.translit)));
    if (held.length) {
      console.log(`   ⏸ ${held.length} מוחזקות עד להכרעת ה-ق: ${held.map((v) => v.translit).join(" · ")}`);
    }
    const have = list.length - missing.length;
    newTotal += missing.length;
    console.log(`\n### ${label} — ${list.length} סה"כ · ${have} קיימים · ${missing.length} חדשים\n`);
    for (const v of missing) {
      const flag = v.needsNikud ? " ⚠️ בלי ניקוד" : "";
      console.log(`  ${v.translit.padEnd(20)} ${v.he}${flag}`);
    }
    if (!ONLY_NEW && have) {
      const existing = list.filter(covered);
      console.log(`\n  כבר קיימים: ${existing.map((v) => v.translit).join(" · ")}`);
    }
  }

  const needNikud = NOTES_VOCAB.filter(
    (v) =>
      v.needsNikud &&
      !known.has(strip(v.translit)) &&
      !known.has(corrected.get(strip(v.translit)) ?? "\u0000") &&
      !heldOnQaf.has(strip(v.translit))
  ).length;
  console.log(`\n${newTotal} כרטיסים חדשים · ${needNikud} מהם צריכים ניקוד מ-chatifai`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
