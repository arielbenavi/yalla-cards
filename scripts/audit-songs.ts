// Runs the songs schema check (note efbd5595) over every song.
//   npx tsx scripts/audit-songs.ts            # summary
//   npx tsx scripts/audit-songs.ts --detail   # every issue
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { checkSong, isPending, type LyricLine } from "../lib/song-schema";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const DETAIL = process.argv.includes("--detail");

async function main() {
  const { data } = await sb.from("songs").select("id, title, artist, lyrics_parsed");

  let clean = 0;
  for (const s of data ?? []) {
    const lines = (s.lyrics_parsed ?? []) as LyricLine[];
    const all = checkSong(lines);
    // Awaiting content is reported, but it is not a defect — a song whose only
    // outstanding item is the Arabic script is otherwise correctly formed.
    const pending = all.filter(isPending);
    const issues = all.filter((i) => !isPending(i));

    if (issues.length === 0) {
      clean++;
      const note = pending.length ? ` · ⏳ ${pending.length} ממתינות לכתב ערבי` : "";
      console.log(`✅ ${String(s.title).padEnd(24)} ${lines.length} שורות${note}`);
      continue;
    }

    // Group by problem so the report says what is wrong, not just how much
    const byProblem = new Map<string, number>();
    for (const i of issues) {
      const key = `${i.field}: ${i.problem}`;
      byProblem.set(key, (byProblem.get(key) ?? 0) + 1);
    }

    console.log(`❌ ${String(s.title).padEnd(24)} ${lines.length} שורות · ${issues.length} בעיות`);
    for (const [k, n] of [...byProblem].sort((a, b) => b[1] - a[1])) {
      console.log(`     ${String(n).padStart(4)} × ${k}`);
    }
    if (DETAIL) {
      for (const i of issues.slice(0, 40)) {
        console.log(`       שורה ${String(i.line).padStart(3)}  ${i.field.padEnd(16)} ${i.value.slice(0, 40)}`);
      }
      if (issues.length > 40) console.log(`       ... ועוד ${issues.length - 40}`);
    }
  }

  console.log(`\n${clean}/${(data ?? []).length} שירים תקינים`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
