// Which words of a song never got a gloss in lyrics_parsed.
//
// `lib/song-schema.ts` checks that the entries which exist are well-formed. It
// cannot see content that was dropped on the way in — and a song can lose a third
// of itself without either the checker or the UI noticing, because a short song
// and a truncated song look identical once the raw text is out of view.
//
// lyrics_raw is Arabic and lyrics_parsed's `line` is a Hebrew transliteration, so
// they cannot be compared directly. The comparison runs through `words[].ar`, and
// at the level of **words**, not lines.
//
// Two line-level approaches were tried first and both manufacture work. Comparing
// by line *index* counts a chorus stored once against four raw repetitions, and
// reported one song as missing eighteen lines when it was missing none. Comparing
// reconstructed lines fails too, because a parsed line may merge two raw lines
// ("كله بيسأل" + "شو بدك؟" is one entry).
//
// Words survive both. They are also the unit that matters: an unglossed word is
// the thing a learner actually hits.
//
// **This produces candidates, not defects.** It cannot resolve spelling variants,
// and the lyrics use them freely: كله against كلو, مهدومة against محضومة, وأنا
// against a line that already glosses و and أنا separately. Every one of those
// reads as a gap here and is not one. Filling a reported gap without first
// checking the line for the same word under another spelling produces duplicate
// glosses — which is exactly what happened, and had to be reverted from backup.
// Reconciling spellings is an Arabic judgement, not a string comparison.
//
//   npx tsx scripts/scan-song-coverage.ts            # summary
//   npx tsx scripts/scan-song-coverage.ts YAMA       # the missing words themselves
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const WANTED = process.argv.slice(2).filter((a) => !a.startsWith("-"))[0];

type Line = { line?: string; words?: { ar?: string; he?: string; translit?: string }[] };

/** Strips harakat, ال, tatweel and punctuation so the two sources can be compared. */
const key = (s: string) =>
  s
    .normalize("NFC")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\bال/g, "")
    .replace(/[^ء-ي]/g, "");

async function main() {
  const { data, error } = await sb.from("songs").select("id, title, lyrics_raw, lyrics_parsed");
  if (error) throw error;

  for (const s of data ?? []) {
    const raw = (s.lyrics_raw ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
    const parsed = ((s.lyrics_parsed ?? []) as Line[]).filter((l) => (l.line ?? "").trim());
    const words = parsed.flatMap((l) => l.words ?? []);
    const noAr = words.filter((w) => !(w.ar ?? "").trim()).length;
    const arInLine = parsed.filter((l) => /[ء-ي]/.test(l.line ?? "")).length;

    // A gloss entry may cover several words at once — `يا عمري` is stored as one
    // entry meaning "חיי שלי", which is better than glossing يا and عمري apart,
    // since the phrase does not mean the sum of them. Comparing entry-for-word
    // therefore reports covered words as missing: it claimed 37 gaps across six
    // songs when almost all of them were multi-word glosses. Split each entry on
    // whitespace as well as keeping it whole.
    const covered = new Set<string>();
    for (const w of words) {
      const ar = w.ar ?? "";
      covered.add(key(ar));
      for (const part of ar.split(/\s+/)) covered.add(key(part));
    }
    covered.delete("");
    const rawWords: string[] = raw.flatMap((l: string) => l.split(/\s+/));
    const missing = [...new Set(rawWords.filter((w) => key(w) && !covered.has(key(w))))];

    // A song whose raw text is not Arabic at all cannot be compared this way,
    // and would otherwise pass silently — every key() comes out empty, so
    // nothing looks uncovered. سوولنا is exactly that case.
    const rawIsArabic = raw.some((l: string) => /[ء-ي]/.test(l));

    const flags = [
      !rawIsArabic ? "lyrics_raw אינו בכתב ערבי — אי אפשר להשוות כיסוי" : null,
      missing.length ? `${missing.length} מועמדים לפירוש חסר` : null,
      noAr ? `${noAr} מילים בלי ערבית` : null,
      arInLine ? `${arInLine} שורות שבהן השדה translit הוא ערבית` : null,
    ].filter(Boolean);

    console.log(
      `${(s.title ?? "").padEnd(24)} ${String(parsed.length).padStart(3)} שורות מפוענחות` +
        (flags.length ? `  ⚠️  ${flags.join(" · ")}` : "  ✅")
    );

    if (WANTED && s.title === WANTED && missing.length) {
      console.log(`\nמועמדים — עלולים להיות וריאציות כתיב של מילים שכבר מפורשות:`);
      for (const l of missing) console.log(`  ${l}`);
      console.log();
    }
  }

  if (!WANTED) console.log(`\nלפירוט: npx tsx scripts/scan-song-coverage.ts "<שם השיר>"`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
