/**
 * Compares speech and transliteration models on a text with known edited subtitles.
 * Nothing is written to the database.
 *   npx tsx scripts/bench-subtitles.ts asr <audio.mp3>
 *   npx tsx scripts/bench-subtitles.ts nikud
 */
import { config } from "dotenv";
import { readFileSync, createReadStream } from "fs";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SEGMENTS } from "./data/story-bad-luck";
config({ path: ".env.local" });

const arNorm = (s: string) =>
  s.replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^ء-ي\s]/g, " ").split(/\s+/).filter(Boolean);

function edit<T>(a: T[], b: T[]): number {
  let prev = b.map((_, j) => j + 1);
  prev.unshift(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

async function gemini(model: string, parts: any[]) {
  const m = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({ model });
  return (await m.generateContent(parts)).response.text();
}

async function asr(path: string) {
  const ref = arNorm(SEGMENTS.map((s) => s[1]).join(" "));
  const prompt = "Transcribe this Palestinian colloquial Arabic story in Arabic script, word for word, as spoken. Do not convert to Modern Standard Arabic. Output only the transcript.";
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const runs: [string, () => Promise<string>][] = [
    ...["whisper-large-v3", "whisper-large-v3-turbo"].map((model) => [`groq ${model}`, async () =>
      (await groq.audio.transcriptions.create({ file: createReadStream(path) as any, model, language: "ar", temperature: 0 })).text] as [string, () => Promise<string>]),
    ...["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-4-argon"].map((model) => [model, () =>
      gemini(model, [prompt, { inlineData: { mimeType: "audio/mp3", data: readFileSync(path).toString("base64") } }])] as [string, () => Promise<string>]),
  ];
  await Promise.all(runs.map(async ([name, run]) => {
    try {
      const text = await run();
      const hyp = arNorm(text);
      console.log(`\n${name}: WER ${pct(edit(hyp, ref) / ref.length)} (${hyp.length}/${ref.length} words)\n${text.slice(0, 260)}`);
    } catch (e) {
      console.log(`\n${name}: failed: ${String(e).slice(0, 140)}`);
    }
  }));
}

const NIKUD_PROMPT = `Write each line of spoken Palestinian Arabic in Hebrew letters with nikud, the way an Israeli course does.
Letters: ب=בּ ت=ת ث=ת' ج=ג' ح=ח خ=ח' د=ד ذ=ד' ر=ר ز=ז س=ס ش=ש ص=צ ض=צ' ط=ט ظ=ט' ع=ע غ=ע' ف=פ ق=ק ك=כּ ل=ל م=מ ن=נ ه=ה و=ו ي=י.
Vowels: a = patach, long a = patach + א, i = hiriq, long i = hiriq + י, e = tsere or segol, u = kubbutz, long u = וּ, long o = וֹ. Doubled letter = dagesh.
The article: (א)ל before moon letters, (אל) with dagesh before sun letters.
Examples: البيت = (א)לְבֵּית · الشغل = (אל)שֻּעֻ'ל · بدي أروح = בִּדִּי אַרוּח · كيف حالك؟ = כִּיפ חַאלַכּ?
Output only a JSON array of strings, one per input line, same order.

`;
const letters = (s: string) => [...s.replace(/[^א-ת']/g, "")];
const full = (s: string) => [...s.replace(/[^א-ת'֑-ׇ]/g, "").replace(/ָ/g, "ַ").replace(/ְ/g, "")];

async function nikud() {
  const lines = SEGMENTS.map((s) => s[1]);
  const gold = SEGMENTS.map((s) => s[2]);
  const input = NIKUD_PROMPT + lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
  const anthropic = new Anthropic();
  const runs: [string, () => Promise<string>][] = [
    ...["claude-opus-5-5", "claude-sonnet-5-5"].map((model) => [model, async () => {
      const r = await anthropic.messages.create({ model, max_tokens: 6000, messages: [{ role: "user", content: input }] });
      return r.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    }] as [string, () => Promise<string>]),
    ...["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-4-argon"].map((model) => [model, () => gemini(model, [input])] as [string, () => Promise<string>]),
  ];
  await Promise.all(runs.map(async ([name, run]) => {
    try {
      const raw = await run();
      const out: string[] = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
      let le = 0, ln = 0, fe = 0, fn = 0;
      gold.forEach((g, i) => {
        le += edit(letters(out[i] ?? ""), letters(g)); ln += letters(g).length;
        fe += edit(full(out[i] ?? ""), full(g)); fn += full(g).length;
      });
      console.log(`\n${name}: letters ${pct(le / ln)} off · letters+nikud ${pct(fe / fn)} off\n  ${out[5]}\n  ${out[18]}`);
    } catch (e) {
      console.log(`\n${name}: failed: ${String(e).slice(0, 140)}`);
    }
  }));
  console.log(`\ngold:\n  ${gold[5]}\n  ${gold[18]}`);
}

(process.argv[2] === "asr" ? asr(process.argv[3]) : nikud()).catch(console.error);
