// Undoes scripts/fill-song-glosses.ts from its backup files.
//
// Why this had to be used: the placement heuristic in that script is not
// reliable. Of five words it inserted into YAMA, four were wrong —
//
//   كله   was already glossed as كلو      (same word, different spelling)
//   مهدومة was already glossed as محضومة   (same word, different spelling)
//   واللي  was already covered by اللي جاي / اللي غاب
//   الدماغ was placed in the wrong line entirely
//
// — and both ZIDI inserts duplicated glosses that already existed as و + أنا.
//
// The root cause is the same one that made the scanner overcount in the first
// place: gloss entries and raw tokens do not correspond one-to-one, and matching
// them on normalised text alone cannot see that كلو and كله are the same word or
// that و + أنا already covers وأنا. Anything that adds words to a song has to
// reconcile spellings first, and that is an Arabic judgement, not a string
// comparison.
//
//   npx tsx scripts/revert-song-glosses.ts <backup.json> --apply
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const path = process.argv.slice(2).find((a) => a.endsWith(".json"));

async function main() {
  if (!path) throw new Error("צריך נתיב לקובץ גיבוי");

  // backups/song-<uuid>-<timestamp>.json
  const songId = basename(path).slice(5, 5 + 36);
  const bak = JSON.parse(readFileSync(path, "utf8"));

  const { data: song } = await sb.from("songs").select("title").eq("id", songId).single();
  console.log(`${song?.title ?? songId}: משחזר ${bak.song_word_srs?.length ?? 0} שורות SRS`);

  if (!APPLY) {
    console.log("dry run — הוסף --apply");
    return;
  }

  const { error } = await sb
    .from("songs")
    .update({ lyrics_parsed: bak.lyrics_parsed })
    .eq("id", songId);
  if (error) throw error;

  for (const r of bak.song_word_srs ?? []) {
    const { error: e } = await sb
      .from("song_word_srs")
      .update({ word_index: r.word_index })
      .eq("id", r.id);
    if (e) throw e;
  }
  console.log("↩️  שוחזר");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
