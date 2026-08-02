// Clears `words[].ar` values that are not Arabic.
//
// سوولنا كاسة شاي has the unpointed Hebrew transliteration sitting in all 118 of
// its `ar` slots — the Arabic script was never collected. The song drill shows
// that field as the question ("מה המשמעות של ..."), so it presents Hebrew as
// though it were the Arabic spelling, which teaches the wrong thing.
//
// The value is not lost by clearing it: the same text, pointed, is already in
// the line's `line` field, and the Latin transliteration is in `translit`. An
// empty `ar` is an honest "not collected yet"; the drill falls back to the
// transliteration (see app/songs/[id]/page.tsx).
//
// The previous values are written to a backup file so this is reversible.
//
//   npx tsx scripts/clear-bogus-song-arabic.ts          # dry run
//   npx tsx scripts/clear-bogus-song-arabic.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const BACKUP = "/tmp/song-ar-backup.json";

const ARABIC = /[؀-ۿ]/;
const HEBREW = /[֐-׿]/;

type Word = { ar?: string; he?: string; translit?: string };
type Line = { line: string; words?: Word[] };

async function main() {
  const { data, error } = await sb.from("songs").select("id, title, lyrics_parsed");
  if (error) throw error;

  const backup: Record<string, string[]> = {};
  const updates: { id: string; title: string; lyrics: Line[]; n: number }[] = [];

  for (const song of data ?? []) {
    const lines = structuredClone((song.lyrics_parsed as Line[]) ?? []);
    const removed: string[] = [];

    for (const l of lines) {
      for (const w of l.words ?? []) {
        if (!w.ar) continue;
        // Only clear values that are Hebrew and contain no Arabic at all.
        if (ARABIC.test(w.ar) || !HEBREW.test(w.ar)) continue;
        removed.push(w.ar);
        w.ar = "";
      }
    }

    if (!removed.length) continue;
    backup[song.id] = removed;
    updates.push({ id: song.id, title: song.title, lyrics: lines, n: removed.length });
    console.log(`  ${song.title} — ${removed.length} ערכים לניקוי (דוגמה: ${removed[0]})`);
  }

  if (!updates.length) {
    console.log("אין ערכי ar עם עברית — כלום לתקן");
    return;
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
  console.log(`\nגיבוי נכתב ל-${BACKUP}`);

  for (const u of updates) {
    const { error: e } = await sb.from("songs").update({ lyrics_parsed: u.lyrics }).eq("id", u.id);
    if (e) throw e;
    console.log(`✅ ${u.title} — ${u.n} ערכים נוקו`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
