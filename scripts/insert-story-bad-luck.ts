// Uploads "המזל הרע" to the private recordings bucket and writes its subtitles (/watch/bad-luck).
// Safe to rerun: the item keeps its id and its lines are replaced.
//   npx tsx scripts/insert-story-bad-luck.ts          # dry run
//   npx tsx scripts/insert-story-bad-luck.ts --apply
import { config } from "dotenv";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { sentenceWords, translitKey } from "../lib/word-lookup";
import { END_SEC, GLOSSES, SEGMENTS } from "./data/story-bad-luck";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const VIDEO = "/Users/arismac/Sync/win_mac_sync/CUNI/CUNI/ARAVIT/סיפורים של מינרוה/המזל הרע/המזל הרע.mp4";
const PATH = "media/bad-luck.mp4";
const LESSON = "5e995fe3-2946-4614-963d-394a2a0bfca6"; // מפגש בעל פה 6

(async () => {
  const glosses = Object.fromEntries(Object.entries(GLOSSES).map(([k, v]) => [translitKey(k), v]));
  let misaligned = 0;
  const missing = new Set<string>();
  for (const [, ar, tr] of SEGMENTS) {
    if (/[א-ת]/.test(ar)) throw new Error(`Hebrew in Arabic: ${ar}`);
    if (/[ء-ي]/.test(tr)) throw new Error(`Arabic in translit: ${tr}`);
    const words = sentenceWords(tr, ar);
    if (!words.every((w) => w.arabic)) { misaligned++; console.log("not aligned:", tr); }
    words.filter((w) => !glosses[translitKey(w.text)]).forEach((w) => missing.add(w.text));
  }
  console.log(`${SEGMENTS.length} lines, ${misaligned} not aligned, ${Object.keys(glosses).length} glosses, missing: ${[...missing].join(" | ") || "none"}`);
  if (missing.size) throw new Error("a word has no gloss");
  if (!APPLY) return console.log("dry run: pass --apply");

  const { error: upErr } = await sb.storage.from("recordings").upload(PATH, readFileSync(VIDEO), { contentType: "video/mp4", upsert: true });
  if (upErr) throw upErr;
  const { data: item, error } = await sb.from("media_items").upsert({
    slug: "bad-luck", title: "המזל הרע", storage_path: PATH, source_url: "https://youtu.be/6QubRNusq_g",
    duration_sec: END_SEC, lesson_id: LESSON, glosses, notes: "הכתוביות מהסרטון של מינרוה. התרגום לעברית והמילון אינם של המו\"ל.",
  }, { onConflict: "slug" }).select("id").single();
  if (error) throw error;
  await sb.from("media_segments").delete().eq("item_id", item.id);
  const { error: segErr } = await sb.from("media_segments").insert(SEGMENTS.map(([start, ar, translit, he], idx) => ({
    item_id: item.id, idx, start_sec: start, end_sec: SEGMENTS[idx + 1]?.[0] ?? END_SEC, ar, translit, he, verified: true, source: "burned-in",
  })));
  if (segErr) throw segErr;
  console.log("✅", item.id);
})();
