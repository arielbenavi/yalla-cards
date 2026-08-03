// Fills the song words that have no gloss (note efbd5595), using chatifai's
// rulings in scripts/data/song-glosses.ts.
//
// This matters because app/songs/[id]/page.tsx builds a line's Hebrew
// translation by joining its words — a missing word is a line whose translation
// is quietly incomplete, not a cosmetic gap.
//
// The hazard: song_word_srs.word_index is a *positional* index into the
// flattened lyrics_parsed[].words. Inserting anywhere but the end shifts every
// later index and re-points existing review history at the wrong word. YAMA is
// both the song that needs words added and the one holding 71 review rows, so
// this cannot be sidestepped. Every insert therefore goes through
// lib/song-words.ts, which computes the moves and refuses if anything does not
// line up.
//
//   npx tsx scripts/fill-song-glosses.ts          # dry run
//   npx tsx scripts/fill-song-glosses.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { SONG_GLOSSES } from "./data/song-glosses";
import { flattenWords, remapWordIndices, orderedMoves, type LyricLine } from "../lib/song-words";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const key = (s: string) =>
  s.normalize("NFC").replace(/[ً-ْٰـ]/g, "").replace(/[^ء-ي]/g, "");

/**
 * Bare conjunctions and negators are not glossed.
 *
 * Every entry in `words` is a candidate review item, and "and" is not something
 * to be tested on. Each insert also shifts every later word_index, so adding one
 * costs a hundred-row remap on YAMA in exchange for nothing. chatifai ruled them
 * — the rulings stay in the data file — but they are not written here.
 */
const NOT_WORTH_AN_ENTRY = new Set(["و", "لا"].map((w) => w.normalize("NFC")));

const glossFor = (word: string) =>
  SONG_GLOSSES.find((g) => key(g.ar) === key(word));

/** Arabic tokens a gloss entry covers — entries may hold several words. */
const entryKeys = (ar: string): string[] => [
  key(ar),
  ...ar.split(/\s+/).map(key).filter(Boolean),
];

async function main() {
  const { data: songs, error } = await sb
    .from("songs")
    .select("id, title, lyrics_raw, lyrics_parsed");
  if (error) throw error;

  for (const song of songs ?? []) {
    const raw = (song.lyrics_raw ?? "")
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
    const lines = (song.lyrics_parsed ?? []) as LyricLine[];
    if (!lines.length || !raw.some((l: string) => /[ء-ي]/.test(l))) continue;

    const before = flattenWords(lines);
    const next: LyricLine[] = lines.map((l) => ({ ...l, words: [...(l.words ?? [])] }));
    const added: string[] = [];
    const unruled = new Set<string>();

    for (const rawLine of raw) {
      const tokens = rawLine.split(/\s+/).filter((t: string) => key(t));

      // The parsed line for this raw line is the one whose glosses cover the
      // most of its tokens. Matching by index does not work: a parsed line may
      // merge two raw lines, and a repeated chorus is stored once.
      let bestIdx = -1;
      let bestScore = 0;
      next.forEach((l, i) => {
        const covered = new Set((l.words ?? []).flatMap((w) => entryKeys(w.ar ?? "")));
        const score = tokens.filter((t: string) => covered.has(key(t))).length;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });
      if (bestIdx === -1) continue;

      const target = next[bestIdx];
      for (const tok of tokens) {
        const covered = new Set((target.words ?? []).flatMap((w) => entryKeys(w.ar ?? "")));
        if (covered.has(key(tok))) continue;

        if (NOT_WORTH_AN_ENTRY.has(key(tok))) continue;

        const g = glossFor(tok);
        if (!g) {
          unruled.add(tok);
          continue;
        }

        // Insert where the word sits in the raw line, so the joined Hebrew
        // translation still reads in order.
        const pos = tokens.indexOf(tok);
        const at = Math.min(pos, target.words!.length);
        target.words!.splice(at, 0, { ar: g.ar, he: g.he, translit: g.translit });
        added.push(`${g.ar} → ${g.he}`);
      }
    }

    if (!added.length) {
      if (unruled.size) {
        console.log(`${song.title}: ${unruled.size} מילים בלי פסק — ${[...unruled].join(" · ")}`);
      }
      continue;
    }

    const remap = remapWordIndices(before, flattenWords(next));
    console.log(`\n## ${song.title} — ${added.length} פירושים`);
    for (const a of added) console.log(`   + ${a}`);
    if (unruled.size) console.log(`   ⏸ בלי פסק: ${[...unruled].join(" · ")}`);

    if (!remap.ok) {
      console.log(`   ❌ ${remap.reason} — לא נכתב כלום לשיר הזה`);
      continue;
    }

    const moves = orderedMoves(remap.moves);
    console.log(`   ${moves.length} שורות SRS צריכות מיפוי מחדש`);

    if (!APPLY) continue;

    // Backed up before the write, not after: this is the only script on the
    // project that moves rows of existing review history, and the JSON below is
    // the only way back if the placement turns out wrong.
    const { data: srsBefore } = await sb
      .from("song_word_srs")
      .select("id, word_index")
      .eq("song_id", song.id);
    mkdirSync("backups", { recursive: true });
    const backup = `backups/song-${song.id}-${Date.now()}.json`;
    writeFileSync(
      backup,
      JSON.stringify({ lyrics_parsed: lines, song_word_srs: srsBefore }, null, 2)
    );
    console.log(`   גיבוי: ${backup}`);

    const { error: upErr } = await sb
      .from("songs")
      .update({ lyrics_parsed: next })
      .eq("id", song.id);
    if (upErr) throw upErr;

    // Highest target first, so a row never lands on a position still held by a
    // row that has yet to move.
    for (const [from, to] of moves) {
      const { error } = await sb
        .from("song_word_srs")
        .update({ word_index: to })
        .eq("song_id", song.id)
        .eq("word_index", from);
      if (error) throw error;
    }
    console.log(`   ✅ נכתב`);
  }

  if (!APPLY) console.log("\ndry run — הוסף --apply כדי לכתוב");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
