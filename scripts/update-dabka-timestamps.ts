/**
 * Adds section timestamps to דבקה בתל אביב lyrics_parsed.
 * 0:00 → אִסְמַע יַא וַלַד (opening)
 * 1:22 → אִזְ-זְלַאם צַבּוּ צַבּוּהַא (second section)
 * Run: npx tsx scripts/update-dabka-timestamps.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data: song, error } = await s
    .from("songs")
    .select("id, lyrics_parsed")
    .eq("title", "דבקה בתל אביב")
    .single();

  if (error || !song) { console.error("Song not found"); process.exit(1); }

  const lines = song.lyrics_parsed as Array<{ line: string; words: unknown[]; timestamp?: string }>;

  // Mark the first line with 0:00
  const firstIdx = 0;
  // Mark the line that starts with אִזְ-זְלַאם
  const secondIdx = lines.findIndex((l) => l.line.startsWith("אִזְ-זְלַאם"));

  if (secondIdx === -1) { console.error("Could not find אִזְ-זְלַאם line"); process.exit(1); }

  lines[firstIdx] = { ...lines[firstIdx], timestamp: "0:00" };
  lines[secondIdx] = { ...lines[secondIdx], timestamp: "1:22" };

  const { error: updateErr } = await s
    .from("songs")
    .update({ lyrics_parsed: lines })
    .eq("id", song.id);

  if (updateErr) { console.error(updateErr.message); process.exit(1); }
  console.log(`Updated דבקה בתל אביב (${song.id})`);
  console.log(`  Line ${firstIdx + 1}: "${lines[firstIdx].line}" → 0:00`);
  console.log(`  Line ${secondIdx + 1}: "${lines[secondIdx].line}" → 1:22`);
}

main().catch((e) => { console.error(e); process.exit(1); });
