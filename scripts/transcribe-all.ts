/**
 * Batch-transcribes all recordings that have no transcript yet.
 * Uses the same /api/recordings/:id/transcribe-chunk + save-transcript
 * pipeline, but called directly via Supabase + Groq SDK so it runs
 * outside the browser.
 *
 * Usage: npx tsx scripts/transcribe-all.ts [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const DRY = process.argv.includes("--dry-run");

async function main() {
  const { data: recordings, error } = await supabase
    .from("recordings")
    .select("id, storage_path, duration_sec, transcript_json, title, lesson:lessons(title)")
    .is("transcript_json", null)
    .order("created_at", { ascending: true });

  if (error) { console.error(error); process.exit(1); }
  if (!recordings?.length) { console.log("✓ All recordings already transcribed."); return; }

  console.log(`Found ${recordings.length} untranscribed recording(s).${DRY ? " (dry run)" : ""}\n`);

  for (const rec of recordings) {
    const lessonRaw = rec.lesson as { title: string } | { title: string }[] | null;
    const lessonTitle = (Array.isArray(lessonRaw) ? lessonRaw[0]?.title : lessonRaw?.title) ?? "ללא שיעור";
    const label = rec.title ?? `${lessonTitle} — ${rec.id.slice(0, 8)}`;
    console.log(`→ ${label} (${Math.round((rec.duration_sec ?? 0) / 60)}min)`);

    if (DRY) continue;

    // Download from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("recordings")
      .download(rec.storage_path);

    if (dlErr || !fileData) {
      console.error(`  SKIP: download failed — ${dlErr?.message}`);
      continue;
    }

    // Groq Whisper transcription
    try {
      const file = new File([await fileData.arrayBuffer()], "audio.ogg", { type: "audio/ogg" });
      const result = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
        language: "ar",
      });

      const rawWords = (result as unknown as { words?: { word: string; start: number; end: number }[] }).words;
      const words = (rawWords ?? []).map((w) => ({
        word: w.word.trim(),
        start: w.start,
        end: w.end,
      })).filter((w) => w.word);

      if (!words.length) {
        console.log(`  SKIP: no words returned`);
        continue;
      }

      const { error: saveErr } = await supabase
        .from("recordings")
        .update({ transcript_json: { words } })
        .eq("id", rec.id);

      if (saveErr) {
        console.error(`  ERROR saving transcript: ${saveErr.message}`);
      } else {
        console.log(`  ✓ ${words.length} words`);
      }
    } catch (e) {
      console.error(`  ERROR: ${(e as Error).message}`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
