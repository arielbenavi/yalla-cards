/**
 * Who is speaking in a proposed clip, read off the class video: Zoom shows the speaker's tile with
 * their name, and a green frame on the active tile in gallery view. Teacher clips stay as they are;
 * a student's clip drops in the queue so it comes after the teacher's. No frame is stored. Nothing
 * here touches cards or FSRS.
 *   npx tsx scripts/clip-speakers.ts --pilot <file> <sec> <sec> ...   # just read these moments
 *   npx tsx scripts/clip-speakers.ts                                  # dry run on the pending queue
 *   npx tsx scripts/clip-speakers.ts --apply
 * Safe to rerun: a suggestion that already has signals.speaker is skipped.
 */
import { config } from "dotenv";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({ model: "gemini-3.8-flash", generationConfig: { responseMimeType: "application/json" } });
const DIR = "/Users/arismac/Sync/win_mac_sync/CUNI/CUNI/ARAVIT";
const WORK = mkdtempSync(join(tmpdir(), "speakers-"));
const TEACHERS = /ronen|רונן/i;
const STUDENT_FACTOR = 0.6;

const PROMPT = `This is a frame from a Zoom class recording. Who is speaking now?
- If several video tiles show side by side, the speaker is the tile with a green border. Read the name on that tile.
- If one large speaker tile shows in the corner, read the name on it.
- If no Zoom tiles are visible, or no tile is marked, the answer is null.
Copy the name exactly as written. Return JSON: {"speaker": string or null}.`;

async function speakerAt(file: string, sec: number): Promise<string | null> {
  const out = join(WORK, "f.jpg");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(sec), "-i", join(DIR, file), "-frames:v", "1", "-vf", "scale=1400:-1", "-q:v", "4", out]);
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await model.generateContent([PROMPT, { inlineData: { mimeType: "image/jpeg", data: readFileSync(out).toString("base64") } }]);
      return (JSON.parse(r.response.text()) as { speaker: string | null }).speaker || null;
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((res) => setTimeout(res, 3000 * (attempt + 1)));
    }
  }
}

(async () => {
  const pilot = process.argv.indexOf("--pilot");
  if (pilot > 0) {
    const [file, ...secs] = process.argv.slice(pilot + 1);
    for (const s of secs) console.log(s, await speakerAt(file, Number(s)));
    process.exit(0);
  }
  const APPLY = process.argv.includes("--apply");
  const { data: recs, error } = await sb.from("recordings").select("id,source_filename").in("tag", ["שיעור זום", "מפגש בעל פה"]);
  if (error) throw error;
  const fileOf = new Map((recs ?? []).map((r) => [r.id, r.source_filename as string]));
  const rows: { id: string; recording_id: string; start_sec: number; end_sec: number; confidence: number; signals: Record<string, unknown> }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error: e } = await sb.from("clip_suggestions").select("id,recording_id,start_sec,end_sec,confidence,signals").eq("status", "pending").in("recording_id", [...fileOf.keys()]).range(f, f + 999);
    if (e) throw e;
    rows.push(...(data as typeof rows));
    if (!data || data.length < 1000) break;
  }
  const todo = rows.filter((r) => r.signals?.speaker === undefined);
  console.log(`${rows.length} pending from class recordings, ${todo.length} to read`);
  if (!APPLY) process.exit(0);
  const tally: Record<string, number> = {};
  for (const r of todo) {
    // The tile follows the voice with a delay, so read past the clip's middle
    const speaker = await speakerAt(fileOf.get(r.recording_id)!, r.start_sec + (r.end_sec - r.start_sec) * 0.7 + 0.5);
    tally[speaker ?? "לא זוהה"] = (tally[speaker ?? "לא זוהה"] ?? 0) + 1;
    const student = speaker != null && !TEACHERS.test(speaker);
    const { error: e } = await sb.from("clip_suggestions").update({
      signals: { ...r.signals, speaker, confidence_before_speaker: r.confidence },
      confidence: student ? r.confidence * STUDENT_FACTOR : r.confidence,
    }).eq("id", r.id);
    if (e) throw e;
  }
  console.log(tally);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
