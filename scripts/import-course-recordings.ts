// Adds the course's class recordings (ARAVIT folder) as audio-only recordings, so auto-clip.ts can
// propose clips from them. The video stays on the computer; only mono 32 kbps audio is uploaded
// (about 14 MB an hour) to the private bucket. Safe to rerun: a file already imported is skipped.
//   npx tsx scripts/import-course-recordings.ts          # dry run
//   npx tsx scripts/import-course-recordings.ts --apply
// Rollback: delete from recordings where tag in ('שיעור זום','מפגש בעל פה'), and the files under course/.
import { config } from "dotenv";
import { execFileSync } from "child_process";
import { randomUUID } from "crypto";
import { mkdirSync, readdirSync, readFileSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const DIR = "/Users/arismac/Sync/win_mac_sync/CUNI/CUNI/ARAVIT";
const WORK = join(tmpdir(), "yalla-course-audio");
mkdirSync(WORK, { recursive: true });

(async () => {
  const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".mp4"));
  const { data: existing, error: e0 } = await sb.from("recordings").select("source_filename").in("tag", ["שיעור זום", "מפגש בעל פה"]);
  if (e0) throw e0;
  const known = new Set((existing ?? []).map((r) => r.source_filename));
  let total = 0;
  for (const [i, f] of files.entries()) {
    const src = join(DIR, f);
    const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).toString());
    total += duration;
    if (known.has(f)) { console.log("skip", f); continue; }
    console.log(`${f}: ${Math.round(duration / 60)} min`);
    if (!APPLY) continue;
    const out = join(WORK, `${i}.m4a`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "aac", "-b:a", "32k", out]);
    const path = `course/${randomUUID()}.m4a`;
    const { error } = await sb.storage.from("recordings").upload(path, readFileSync(out), { contentType: "audio/mp4" });
    if (error) throw error;
    const { error: e2 } = await sb.from("recordings").insert({
      title: f.replace(/\.mp4$/i, ""), storage_path: path, duration_sec: duration, source_filename: f,
      tag: f.includes("מפגש בעל פה") ? "מפגש בעל פה" : "שיעור זום",
    });
    if (e2) throw e2;
    console.log(`  ✓ ${(statSync(out).size / 1e6).toFixed(0)} MB`);
  }
  console.log(`${files.length} files, ${(total / 3600).toFixed(1)} hours, about ${Math.round((total / 3600) * 14.4)} MB`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
