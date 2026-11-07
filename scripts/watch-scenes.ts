/**
 * An episode with burned-in Arabic becomes short, self-contained scenes on /watch: reads the subtitles
 * off the video (they are edited, unlike a transcript), checks them against the audio, adds
 * transliteration, Hebrew and word meanings, splits by scene, and uploads a small mp4 per scene.
 * Every line stays verified=false: nothing here has passed chatifai.
 *   npx tsx scripts/watch-scenes.ts --file ep.mp4 --series "..." --slug ep1 --cache dir          # dry run
 *   npx tsx scripts/watch-scenes.ts --file ep.mp4 --series "..." --slug ep1 --cache dir --apply
 * Safe to rerun: each model answer is kept in --cache.
 */
import { config } from "dotenv";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fixBet, translitKey } from "../lib/word-lookup";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const APPLY = process.argv.includes("--apply");
const READ_MODEL = "gemini-4-argon";
const TEXT_MODEL = "gemini-3.1-pro-preview";
const [file, series, slug] = [arg("file")!, arg("series")!, arg("slug")!];
// One folder per slug: a shared --cache once served one episode's video and subtitles for another (2026-11-07).
const cache = join(arg("cache")!, slug);
mkdirSync(cache, { recursive: true });

type Line = { start: number; end: number; ar: string; heard?: string; translit?: string; he?: string; words?: { t: string; he: string }[] };
const parse = <T,>(raw: string): T => JSON.parse(raw.slice(Math.min(...["[", "{"].map((c) => { const i = raw.indexOf(c); return i < 0 ? Infinity : i; })), Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}")) + 1));
async function ask<T>(name: string, model: string, parts: any[]): Promise<T> {
  const f = join(cache, `${name}.json`);
  if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  for (let a = 0; ; a++) {
    try {
      const r = await genAI.getGenerativeModel({ model, generationConfig: { responseMimeType: "application/json" } }, { timeout: 280_000 }).generateContent(parts);
      const out = parse<T>(r.response.text());
      writeFileSync(f, JSON.stringify(out));
      return out;
    } catch (e) {
      console.log(`  ${name} attempt ${a + 1}: ${String(e).slice(0, 110)}`);
      if (a >= 2) throw e;
    }
  }
}
const ffmpeg = (...a: string[]) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
const SMALL = ["-vf", "scale=640:-2", "-c:v", "libx264", "-crf", "29", "-preset", "veryfast", "-c:a", "aac", "-b:a", "48k", "-ac", "1", "-movflags", "+faststart"];

(async () => {
  const small = join(cache, "small.mp4");
  if (!existsSync(small)) ffmpeg("-i", file, ...SMALL, small);
  const raw = await ask<Line[]>("read", READ_MODEL, [
    `This video has Arabic subtitles burned in at the bottom. For every subtitle on screen return when it appears and disappears, and its text copied exactly, with its spelling. Also write in "heard" what the speaker actually says, word for word in colloquial Arabic script, when it differs from the subtitle; otherwise omit it. Skip logos and on-screen titles. Return a JSON array of {"start": seconds, "end": seconds, "ar": text, "heard": text}, in order.`,
    { inlineData: { mimeType: "video/mp4", data: readFileSync(small).toString("base64") } },
  ]);
  const lines = raw.filter((l) => l.ar?.trim() && l.end > l.start);
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
  console.log(`${lines.length} subtitle lines over ${Math.round(dur)}s, ${lines.filter((l) => l.heard && l.heard !== l.ar).length} differ from the audio`);

  const notes = await ask<NonNullable<Pick<Line, "translit" | "he" | "words">>[]>("text", TEXT_MODEL, [
    `For each line of spoken Palestinian Arabic, return {"translit","he","words"}:
- "translit": the line in Hebrew letters with nikud, as an Israeli course writes it, with the same number of space-separated words as the Arabic line. Letters: ب=בּ ت=ת ث=ת' ج=ג' ح=ח خ=ח' د=ד ذ=ד' ر=ר ز=ז س=ס ش=ש ص=צ ض=צ' ط=ט ظ=ט' ع=ע غ=ע' ف=פ ق=ק ك=כּ ل=ל م=מ ن=נ ه=ה و=ו ي=י. a=patach, long a=patach+א, i=hiriq, long i=hiriq+י, e=tsere or segol, u=kubbutz, long u=וּ, long o=וֹ. A doubled letter takes a dagesh. Article: (א)ל before moon letters, (אל) with dagesh before sun letters. Examples: البيت = (א)לְבֵּית · الشغل = (אל)שֻּעֻ'ל · بدي أروح = בִּדִּי אַרוּח.
- "he": a natural Hebrew translation using the surrounding lines.
- "words": for each translit word in order, {"t": the word, "he": its meaning here, 1-3 Hebrew words}.
Return only a JSON array, one object per line, same order.

${lines.map((l, i) => `${i + 1}. ${l.ar}`).join("\n")}`,
  ]);
  if (notes.length !== lines.length) throw new Error(`${notes.length} notes for ${lines.length} lines; delete text.json and rerun`);
  lines.forEach((l, i) => Object.assign(l, notes[i], { translit: fixBet((notes[i].translit ?? "").replace(/ّ/g, "ּ").replace(/[ً-ِْ]/g, "")) }));

  const scenes = await ask<{ from: number; to: number; title: string }[]>("scenes", TEXT_MODEL, [
    `Split this ${Math.round(dur)}-second episode into self-contained scenes of about 60 to 120 seconds each, breaking only where the topic really changes. Return a JSON array of {"from": first line number, "to": last line number, "title": a short Hebrew title}, covering every line in order.

${lines.map((l, i) => `${i + 1}. [${l.start.toFixed(0)}s] ${l.he}`).join("\n")}`,
  ]);
  for (const [i, s] of scenes.entries()) {
    const g = lines.slice(s.from - 1, s.to);
    const from = Math.max(0, i === 0 ? 0 : g[0].start - 0.3);
    const to = Math.min(dur, i === scenes.length - 1 ? dur : lines[s.to].start - 0.1);
    console.log(`scene ${i + 1}: ${s.title} · ${Math.round(from)}–${Math.round(to)}s · ${g.length} lines`);
    if (!APPLY) continue;
    const clip = join(cache, `scene-${i + 1}.mp4`);
    ffmpeg("-ss", String(from), "-i", file, "-t", String(to - from), ...SMALL, clip);
    const path = `media/${slug}-${i + 1}.mp4`;
    const { error } = await sb.storage.from("recordings").upload(path, readFileSync(clip), { upsert: true, contentType: "video/mp4" });
    if (error) throw error;
    const glosses: Record<string, string> = {};
    for (const l of g) for (const w of l.words ?? []) if (w.t && w.he) glosses[translitKey(w.t)] ??= w.he;
    const { data: item, error: e2 } = await sb.from("media_items").upsert({
      slug: `${slug}-${i + 1}`, title: s.title, series, sort: i, storage_path: path, duration_sec: to - from, glosses, notes: "כתוביות מהסרטון, תעתיק ותרגום אוטומטיים, בלי אימות chatifai",
    }, { onConflict: "slug" }).select("id").single();
    if (e2) throw e2;
    await sb.from("media_segments").delete().eq("item_id", item.id);
    const { error: e3 } = await sb.from("media_segments").insert(g.map((l, idx) => ({
      item_id: item.id, idx, start_sec: Math.max(0, l.start - from), end_sec: l.end - from, ar: l.ar, translit: l.translit, he: l.he, verified: false, source: `burned-in via ${READ_MODEL}, ${TEXT_MODEL}`,
    })));
    if (e3) throw e3;
    console.log(`  ✓ /watch/${slug}-${i + 1} ${(statSync(clip).size / 1e6).toFixed(1)} MB`);
  }
  writeFileSync(join(cache, "lines.json"), JSON.stringify(lines, null, 1));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
