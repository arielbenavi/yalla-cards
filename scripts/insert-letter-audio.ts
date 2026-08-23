// Writes the letter ranges from scripts/data/letter-audio.ts into letter_audio.
//
//   npx tsx scripts/insert-letter-audio.ts
//   npx tsx scripts/insert-letter-audio.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { LETTER_CLIPS } from "./data/letter-audio";
import { LETTERS } from "../lib/arabic-letters";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

async function main() {
  const known = new Set(LETTERS.map((l) => l.ch));
  const unknown = LETTER_CLIPS.filter((c) => !known.has(c.letter));
  if (unknown.length) throw new Error(`אותיות שלא ב-LETTERS: ${unknown.map((u) => u.letter).join(" ")}`);

  const recIds = [...new Set(LETTER_CLIPS.map((c) => c.recording))];
  const { data: recs, error } = await sb
    .from("recordings")
    .select("id, title, duration_sec")
    .in("id", recIds);
  if (error) throw error;
  const byId = new Map((recs ?? []).map((r) => [r.id, r]));

  for (const c of LETTER_CLIPS) {
    const r = byId.get(c.recording);
    if (!r) throw new Error(`הקלטה לא נמצאה: ${c.recording}`);
    // A range past the end of the file plays silence, which reads to the
    // learner as a broken button rather than as bad data.
    if (c.end > r.duration_sec) throw new Error(`${c.letter}: ${c.end}s מעבר לאורך ההקלטה (${r.duration_sec}s)`);
  }

  const missing = LETTERS.filter((l) => !LETTER_CLIPS.some((c) => c.letter === l.ch));
  console.log(`${LETTER_CLIPS.length} טווחים · ${LETTERS.length} אותיות ב-LETTERS`);
  if (missing.length) console.log(`בלי אודיו: ${missing.map((m) => `${m.ch} (${m.name})`).join(", ")}`);
  console.log();
  for (const c of LETTER_CLIPS) {
    console.log(`${c.letter}  ${c.start.toFixed(1)}–${c.end.toFixed(1)}s  (${(c.end - c.start).toFixed(1)}s)  ${c.note.slice(0, 60)}`);
  }

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { error: e } = await sb.from("letter_audio").upsert(
    LETTER_CLIPS.map((c) => ({
      letter: c.letter,
      recording_id: c.recording,
      start_sec: c.start,
      end_sec: c.end,
      note: c.note,
    })),
    { onConflict: "letter" }
  );
  if (e) throw e;
  console.log(`\n✅ ${LETTER_CLIPS.length} טווחי הגייה נכתבו`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
