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

    const covered = new Set(words.map((w) => key(w.ar ?? "")));
    covered.delete("");
    const rawWords: string[] = raw.flatMap((l: string) => l.split(/\s+/));
    const missing = [...new Set(rawWords.filter((w) => key(w) && !covered.has(key(w))))];

    // A song whose raw text is not Arabic at all cannot be compared this way,
    // and would otherwise pass silently — every key() comes out empty, so
    // nothing looks uncovered. سوولنا is exactly that case.
    const rawIsArabic = raw.some((l: string) => /[ء-ي]/.test(l));

    const flags = [
      !rawIsArabic ? "lyrics_raw אינו בכתב ערבי — אי אפשר להשוות כיסוי" : null,
      missing.length ? `${missing.length} מילים ללא פירוש` : null,
      noAr ? `${noAr} מילים בלי ערבית` : null,
      arInLine ? `${arInLine} שורות שבהן השדה translit הוא ערבית` : null,
    ].filter(Boolean);

    console.log(
      `${(s.title ?? "").padEnd(24)} ${String(parsed.length).padStart(3)} שורות מפוענחות` +
        (flags.length ? `  ⚠️  ${flags.join(" · ")}` : "  ✅")
    );

    if (WANTED && s.title === WANTED && missing.length) {
      console.log(`\nמילים שאין להן פירוש ב-lyrics_parsed:`);
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
