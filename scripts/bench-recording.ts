/**
 * How well subtitles from subtitle-media.ts hear a recording, against the cards hand-clipped
 * from it: for each clip, how many of the card's Arabic words appear in the subtitles at that
 * time. The recording's Whisper transcript gets the same score. Read only.
 *   npx tsx scripts/bench-recording.ts <recording id> <result.json>
 */
import { config } from "dotenv";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { skeleton } from "../lib/deck-examples";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const words = (s: string) => s.split(/[\s،,.؟?!:;/]+/).map(skeleton).filter((w) => w.length >= 2);
const PAD = 2;

(async () => {
  const [id, path] = process.argv.slice(2);
  const lines: { start: number; end: number; ar: string }[] = JSON.parse(readFileSync(path, "utf8"));
  const { data: rec } = await sb.from("recordings").select("transcript_ar_json").eq("id", id).single();
  const whisper: { start: number; end: number; word: string }[] = (rec?.transcript_ar_json as any)?.words ?? [];
  const { data: cards } = await sb.from("cards").select("arabic_script,audio_start_sec,audio_end_sec").eq("recording_id", id).not("arabic_script", "is", null);
  let total = 0, gem = 0, wh = 0, gemAll = 0, whAll = 0, n = 0;
  for (const c of cards ?? []) {
    const want = words(c.arabic_script!);
    if (!want.length || c.audio_start_sec == null) continue;
    n++;
    const a = c.audio_start_sec - PAD, b = c.audio_end_sec + PAD;
    const g = new Set(lines.filter((l) => l.end >= a && l.start <= b).flatMap((l) => words(l.ar)));
    const w = new Set(whisper.filter((x) => x.end >= a && x.start <= b).flatMap((x) => words(x.word)));
    const gHit = want.filter((x) => g.has(x)).length, wHit = want.filter((x) => w.has(x)).length;
    total += want.length; gem += gHit; wh += wHit;
    if (gHit === want.length) gemAll++;
    if (wHit === want.length) whAll++;
  }
  const pct = (x: number, y: number) => `${Math.round((100 * x) / y)}%`;
  console.log(`${n} clipped cards, ${total} words, ${lines.length} subtitle lines`);
  console.log(`words heard at the right time: subtitles ${pct(gem, total)} · Whisper ${pct(wh, total)}`);
  console.log(`cards heard whole: subtitles ${pct(gemAll, n)} · Whisper ${pct(whAll, n)}`);
  process.exit(0);
})();
