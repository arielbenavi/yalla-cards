// Fills the five songs that had no (or partial) Hebrew transliteration, in the
// YAMA/ZIDI shape: `line` = pointed Hebrew transliteration of the whole line,
// `words` = every word in order with Arabic script, Hebrew meaning and a
// Hebrew transliteration. Source: chatifai, 2026-10-20, one full pass per song
// for the lines and a second pass for complete word-by-word breakdowns.
//
// Immer keeps its English/German lines as they are; only the Arabic lines are
// replaced. The previous lyrics_parsed of every touched song is written to
// backups/ first.
//
//   npx tsx scripts/apply-song-translit-2026-10-20.ts [--dry]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Word = { ar: string; he: string; translit: string };
type Line = { ar?: string; line: string; words: Word[]; timestamp?: string };
const data: Record<string, Line[]> = JSON.parse(readFileSync("scripts/data/song-translit-2026-10-20.json", "utf8"));

const IDS: Record<string, string> = {
  konna: "24207428-b71e-4167-80e1-dfc7cf1b1a3e",
  walamarra: "a99734fa-1b6d-4c7d-8940-8e5578094944",
  bara7a: "057d072b-ca4d-461a-8b95-3c06894069de",
  shai: "ed6da8e5-3bd0-4839-bf4b-3ec1a1270882",
  immer: "9ea28cbb-1105-4646-8ae5-7578d941f0d2",
};
const ARABIC = /[؀-ۿ]/;
const norm = (s: string) => s.replace(/[\s،,.'′()]/g, "").replace(/[إأآ]/g, "ا");
const dry = process.argv.includes("--dry");

async function main() {
  const { data: songs, error } = await sb.from("songs").select("id,title,lyrics_parsed").in("id", Object.values(IDS));
  if (error) throw error;
  writeFileSync(`backups/songs-lyrics-before-translit-2026-10-20.json`, JSON.stringify(songs, null, 1));

  for (const [key, id] of Object.entries(IDS)) {
    const song = songs!.find((s) => s.id === id)!;
    let next: Line[];
    if (key === "immer") {
      const byAr = new Map(data.immer.map((l) => [norm(l.ar!), l]));
      let replaced = 0;
      next = (song.lyrics_parsed as Line[]).map((l) => {
        if (!ARABIC.test(l.line)) return l;
        const hit = byAr.get(norm(l.line));
        if (!hit) { console.warn(`  ⚠ Immer: no match for "${l.line}"`); return l; }
        replaced++;
        return { ...hit, ...(l.timestamp ? { timestamp: l.timestamp } : {}) };
      });
      console.log(`${song.title}: ${replaced} Arabic lines replaced, ${next.length} lines total`);
    } else {
      next = data[key];
      console.log(`${song.title}: ${next.length} lines, ${next.flatMap((l) => l.words).length} words`);
    }
    if (!dry) {
      const { error: e } = await sb.from("songs").update({ lyrics_parsed: next }).eq("id", id);
      if (e) throw e;
    }
  }
  console.log(dry ? "dry run — nothing written" : "✅ written");
}
main().catch((e) => { console.error(e); process.exit(1); });
