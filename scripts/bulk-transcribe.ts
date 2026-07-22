// One-shot: transcribe every recording that lacks transcript_json, then
// auto-generate a Hebrew title for each via Claude Haiku.
// Usage: npx tsx scripts/bulk-transcribe.ts
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type Word = { word: string; start: number; end: number };

async function transcribe(storagePath: string): Promise<Word[]> {
  const { data, error } = await supabase.storage.from("recordings").download(storagePath);
  if (error || !data) throw new Error(`download failed: ${error?.message}`);

  const bytes = new Uint8Array(await data.arrayBuffer());
  const mb = bytes.byteLength / 1024 / 1024;
  if (mb > 22) throw new Error(`קובץ גדול מדי: ${mb.toFixed(1)} MB`);

  const ext = storagePath.split(".").pop() ?? "ogg";
  const resp = (await groq.audio.transcriptions.create({
    model: "whisper-large-v3",
    file: await toFile(bytes, `audio.${ext}`),
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  })) as { words?: Word[] };

  return resp.words ?? [];
}

async function generateTitle(words: Word[]): Promise<string | null> {
  const sample = words.slice(0, 80).map((w) => w.word).join(" ");
  try {
    const resp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `זאת הקלטה של שיעור ערבית פלסטינית. הנה תמלול (בתעתיק עברי) של תחילת ההקלטה:\n"${sample}"\n\nכתוב כותרת קצרה בעברית (3–6 מילים) שמתארת על מה ההקלטה. רק הכותרת, ללא הסברים.`,
      }],
    });
    return resp.content[0].type === "text" ? resp.content[0].text.trim() : null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: recordings, error } = await supabase
    .from("recordings")
    .select("id, storage_path, title")
    .is("transcript_json", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!recordings?.length) {
    console.log("✅ אין הקלטות ללא תמלול");
    return;
  }

  console.log(`📋 ${recordings.length} הקלטות ללא תמלול\n`);

  for (let i = 0; i < recordings.length; i++) {
    const rec = recordings[i];
    console.log(`[${i + 1}/${recordings.length}] ${rec.id.slice(0, 8)}  ${rec.storage_path}`);

    try {
      process.stdout.write("  🎤 מתמלל… ");
      const words = await transcribe(rec.storage_path);

      if (!words.length) {
        console.log("⚠️  לא נמצאו מילים, מדלג");
        continue;
      }

      await supabase.from("recordings").update({ transcript_json: { words } }).eq("id", rec.id);
      console.log(`✅ ${words.length} מילים`);

      if (!rec.title) {
        process.stdout.write("  📝 מייצר כותרת… ");
        const title = await generateTitle(words);
        if (title) {
          await supabase.from("recordings").update({ title }).eq("id", rec.id);
          console.log(`"${title}"`);
        } else {
          console.log("לא הצליח");
        }
      }
    } catch (err) {
      console.log(`❌ ${(err as Error).message}`);
    }
  }

  console.log("\n✅ סיום");
}

main().catch(console.error);
