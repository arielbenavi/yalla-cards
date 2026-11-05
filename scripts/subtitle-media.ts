/**
 * Automatic subtitles for a file or a recording: transcript with times, transliteration
 * (the deck's pointing for words it knows), Hebrew and a meaning for every word. Lines are
 * written with verified = false until a person edits them in /watch/<slug>.
 *   npx tsx scripts/subtitle-media.ts --file a.mp4 --slug x --title "..."            # dry run, prints JSON path
 *   npx tsx scripts/subtitle-media.ts --recording <id> --slug x --title "..." --apply
 *   npx tsx scripts/subtitle-media.ts --file a.mp4 --lines text.json --url https://... --slug x --title "..." --apply
 *     text.json holds edited lines [{ar, he}] with no times: the audio only places them, and
 *     --url plays the video from where it already lives, so nothing is uploaded.
 * Needs ffmpeg. Safe to rerun: the finished transcript of each chunk is kept under --cache.
 */
import { config } from "dotenv";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { forms, skeleton } from "../lib/deck-examples";
import { fixBet, sentenceWords, translitKey } from "../lib/word-lookup";
config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const arg = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const APPLY = process.argv.includes("--apply");
const CHUNK_SEC = 180;
const ASR_MODEL = "gemini-4-argon";
const TEXT_MODEL = "gemini-3.1-pro-preview";

export type Line = { start: number; end: number; ar: string; translit?: string; he?: string; words?: { t: string; he: string }[] };

const json = <T,>(raw: string): T => JSON.parse(raw.slice(Math.min(...["[", "{"].map((c) => { const i = raw.indexOf(c); return i < 0 ? Infinity : i; })), Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}")) + 1));

async function generate(model: string, parts: any[]): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return (await genAI.getGenerativeModel({ model, generationConfig: { responseMimeType: "application/json" } }, { timeout: 300_000 }).generateContent(parts)).response.text();
    } catch (e) {
      console.log(`  ${model} attempt ${attempt + 1} failed: ${String(e).slice(0, 120)}`);
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
    }
  }
}

const ASR_PROMPT = `Transcribe this spoken Palestinian colloquial Arabic in Arabic script, word for word, as spoken. Do not convert to Modern Standard Arabic and do not add anything that wasn't said.
Split it into subtitle lines of at most 12 words, breaking where the speaker pauses. Return a JSON array of {"start": seconds, "end": seconds, "ar": text}, with times measured from the start of this audio, to a tenth of a second. Skip music and silence. Hebrew speech: skip it.`;

async function transcribe(path: string, cacheDir: string): Promise<Line[]> {
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).toString());
  const work = mkdtempSync(join(tmpdir(), "subs-"));
  const lines: Line[] = [];
  for (let from = 0; from < dur; from += CHUNK_SEC) {
    const cached = join(cacheDir, `asr-${from}.json`);
    let chunk: Line[];
    if (existsSync(cached)) chunk = JSON.parse(readFileSync(cached, "utf8"));
    else {
      const mp3 = join(work, `${from}.mp3`);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(from), "-t", String(CHUNK_SEC), "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", mp3]);
      chunk = json<Line[]>(await generate(ASR_MODEL, [ASR_PROMPT, { inlineData: { mimeType: "audio/mp3", data: readFileSync(mp3).toString("base64") } }]));
      writeFileSync(cached, JSON.stringify(chunk));
      console.log(`  heard ${from}s: ${chunk.length} lines`);
    }
    lines.push(...chunk.map((l) => ({ ...l, start: l.start + from, end: l.end + from })));
  }
  return lines;
}

const ALIGN_PROMPT = `These numbered lines are the exact text of this spoken Arabic audio, in order. Find when each line is said.
Do not change, merge or skip any line. Return a JSON array with one {"n": line number, "start": seconds, "end": seconds} per line, to a tenth of a second, measured from the start of the audio.

`;

/** Places edited lines on the audio. Asked per whole file: the lines are short and the file is too. */
async function align(path: string, given: { ar: string; he: string }[], cacheDir: string): Promise<Line[]> {
  const cached = join(cacheDir, "align.json");
  let times: { n: number; start: number; end: number }[];
  if (existsSync(cached)) times = JSON.parse(readFileSync(cached, "utf8"));
  else {
    const mp3 = join(cacheDir, "align.mp3");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", mp3]);
    const prompt = ALIGN_PROMPT + given.map((g, i) => `${i + 1}. ${g.ar}`).join("\n");
    times = json(await generate(ASR_MODEL, [prompt, { inlineData: { mimeType: "audio/mp3", data: readFileSync(mp3).toString("base64") } }]));
    writeFileSync(cached, JSON.stringify(times));
  }
  const byN = new Map(times.map((t) => [t.n, t]));
  return given.map((g, i) => ({ ar: g.ar, he: g.he, start: byN.get(i + 1)?.start ?? -1, end: byN.get(i + 1)?.end ?? -1 }));
}

const TEXT_PROMPT = `For each line of spoken Palestinian Arabic, return an object with:
- "translit": the line in Hebrew letters with nikud, the way an Israeli course writes it. Keep the same number of space-separated words as the Arabic line.
  Letters: ب=בּ ت=ת ث=ת' ج=ג' ح=ח خ=ח' د=ד ذ=ד' ر=ר ز=ז س=ס ش=ש ص=צ ض=צ' ط=ט ظ=ט' ع=ע غ=ע' ف=פ ق=ק ك=כּ ل=ל م=מ ن=נ ه=ה و=ו ي=י.
  Vowels: a = patach, long a = patach + א, i = hiriq, long i = hiriq + י, e = tsere or segol, u = kubbutz, long u = וּ, long o = וֹ. A doubled letter takes a dagesh, never an Arabic shadda.
  The article: (א)ל before moon letters, (אל) with dagesh before sun letters.
  Examples: البيت = (א)לְבֵּית · الشغل = (אל)שֻּעֻ'ל · بدي أروح = בִּדִּי אַרוּח · كيف حالك؟ = כִּיפ חַאלַכּ?
- "he": a natural Hebrew translation of the line, using the lines around it for context.
- "words": for each word of "translit", in order, {"t": the word exactly as in translit, "he": its meaning here in Hebrew, 1-3 words}.
A dictionary of known pointed spellings follows: when a word appears in it, copy that spelling, adding only what is attached to it.
Return only a JSON array, one object per line, same order.`;

async function loadDictionary(): Promise<Map<string, string>> {
  const dict = new Map<string, string>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud,arabic_script,course_verified").range(f, f + 999);
    if (error) throw error;
    for (const c of data ?? []) {
      const ar = (c.arabic_script ?? "").trim();
      if (!ar || /\s/.test(ar) || /\s/.test(c.translit_nikud.trim())) continue;
      const k = skeleton(ar);
      if (k && (c.course_verified || !dict.has(k))) dict.set(k, c.translit_nikud.trim());
    }
    if (!data || data.length < 1000) return dict;
  }
}

// The model sometimes hands back a long stretch as one line. A subtitle stays short:
// split it evenly by words and share out its time the same way.
const MAX_WORDS = 9;
function splitLong(lines: Line[]): Line[] {
  return lines.flatMap((l) => {
    const words = l.ar.trim().split(/\s+/);
    if (words.length <= MAX_WORDS) return [l];
    const parts = Math.ceil(words.length / MAX_WORDS);
    const size = Math.ceil(words.length / parts);
    const perWord = (l.end - l.start) / words.length;
    return Array.from({ length: parts }, (_, i) => ({
      start: l.start + i * size * perWord,
      end: Math.min(l.end, l.start + (i + 1) * size * perWord),
      ar: words.slice(i * size, (i + 1) * size).join(" "),
    }));
  });
}

async function annotate(lines: Line[], dict: Map<string, string>, cacheDir: string) {
  const SIZE = 25;
  for (let i = 0; i < lines.length; i += SIZE) {
    const batch = lines.slice(i, i + SIZE);
    const cached = join(cacheDir, `text-${i}-${batch.length}.json`);
    const known = new Map<string, string>();
    for (const l of batch) for (const w of l.ar.split(/\s+/)) for (const f of forms(skeleton(w))) if (dict.has(f)) known.set(f, dict.get(f)!);
    let out: Pick<Line, "translit" | "he" | "words">[] | null = existsSync(cached) ? JSON.parse(readFileSync(cached, "utf8")) : null;
    for (let attempt = 0; !out && attempt < 3; attempt++) {
      const prompt = `${TEXT_PROMPT}\n\nDictionary:\n${[...known].map(([a, t]) => `${a} = ${t}`).join("\n")}\n\nLines:\n${batch.map((l, n) => `${n + 1}. ${l.ar}`).join("\n")}`;
      const raw = await generate(TEXT_MODEL, [prompt]);
      try {
        const parsed = json<Pick<Line, "translit" | "he" | "words">[]>(raw);
        if (parsed.length === batch.length) out = parsed;
      } catch {
        console.log(`  bad JSON at line ${i}, attempt ${attempt + 1}`);
      }
    }
    if (!out) throw new Error(`annotation failed at line ${i}`);
    writeFileSync(cached, JSON.stringify(out));
    out.forEach((o, n) => Object.assign(batch[n], { translit: fixBet((o.translit ?? "").replace(/ّ/g, "ּ")), he: batch[n].he || o.he, words: o.words }));
    console.log(`  annotated ${i + batch.length}/${lines.length}`);
  }
}

(async () => {
  const slug = arg("slug"); const title = arg("title"); const file = arg("file"); const recording = arg("recording");
  if (!slug || !title || (!file && !recording)) throw new Error("--slug, --title and --file or --recording are required");
  const cacheDir = arg("cache") ?? join(tmpdir(), `subs-cache-${slug}`);
  mkdirSync(cacheDir, { recursive: true });

  let path = file ?? "";
  let storagePath: string | null = null;
  if (recording) {
    const { data, error } = await sb.from("recordings").select("storage_path").eq("id", recording).single();
    if (error) throw error;
    storagePath = data.storage_path;
    const { data: blob, error: e2 } = await sb.storage.from("recordings").download(storagePath!);
    if (e2) throw e2;
    path = join(cacheDir, "source");
    writeFileSync(path, Buffer.from(await blob.arrayBuffer()));
  }

  const given = arg("lines");
  const lines = given
    ? (await align(path, JSON.parse(readFileSync(given, "utf8")), cacheDir)).filter((l) => l.end > l.start)
    : splitLong((await transcribe(path, cacheDir)).filter((l) => l.ar?.trim() && l.end > l.start).sort((a, b) => a.start - b.start));
  console.log(`${lines.length} lines heard, loading the deck...`);
  const dict = await loadDictionary();
  console.log(`dictionary: ${dict.size} words`);
  await annotate(lines, dict, cacheDir);
  const glosses: Record<string, string> = {};
  for (const l of lines) for (const w of l.words ?? []) if (w.t && w.he) glosses[translitKey(w.t)] ??= w.he;
  const aligned = lines.filter((l) => { const s = sentenceWords(l.translit ?? "", l.ar); return s.length > 0 && s.every((w) => w.arabic); }).length;
  const out = join(cacheDir, "result.json");
  writeFileSync(out, JSON.stringify(lines, null, 1));
  console.log(`${lines.length} lines, ${aligned} aligned word by word, ${Object.keys(glosses).length} glosses → ${out}`);
  if (!APPLY) return console.log("dry run: pass --apply");

  const url = arg("url");
  if (url) storagePath = url;
  else if (file) {
    storagePath = `media/${slug}${file.slice(file.lastIndexOf("."))}`;
    const { error } = await sb.storage.from("recordings").upload(storagePath, readFileSync(file), { upsert: true, contentType: file.endsWith(".mp4") ? "video/mp4" : "audio/mpeg" });
    if (error) throw error;
  }
  const { data: item, error } = await sb.from("media_items").upsert(
    { slug, title, storage_path: storagePath, duration_sec: lines.at(-1)?.end ?? null, glosses, notes: "כתוביות אוטומטיות, לא מאומתות" },
    { onConflict: "slug" }
  ).select("id").single();
  if (error) throw error;
  await sb.from("media_segments").delete().eq("item_id", item.id);
  const { error: segError } = await sb.from("media_segments").insert(lines.map((l, idx) => ({
    item_id: item.id, idx, start_sec: l.start, end_sec: l.end, ar: l.ar, translit: l.translit, he: l.he, verified: false, source: given ? `edited text, ${ASR_MODEL} times, ${TEXT_MODEL} translit` : `${ASR_MODEL}+${TEXT_MODEL}`,
  })));
  if (segError) throw segError;
  console.log("✅", `/watch/${slug}`);
})().catch((e) => { console.error(e); process.exit(1); });
