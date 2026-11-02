/**
 * Proposes a recording range for every card that has no clip yet, and fills the
 * clip_suggestions queue that /recordings/auto reads. Nothing here touches cards
 * or FSRS: a clip reaches a card only when Ariel approves it in that screen.
 *
 * Usage:
 *   npx tsx scripts/auto-clip.ts --eval    how well it finds the hand-made clips
 *   npx tsx scripts/auto-clip.ts --hear    transcribe every recording again in Arabic
 *   npx tsx scripts/auto-clip.ts --write   propose ranges, hear each one again, fill the queue
 *
 * Needs ffmpeg, and Node 20 (groq-sdk). Safe to stop and rerun: a recording or a
 * clip that was already heard is not sent again.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  Candidate,
  ClipCard,
  Word,
  candidateScore,
  clipRange,
  finalConfidence,
  findCandidates,
  heardScore,
  indexRecording,
} from "../lib/clip-match";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Rec = {
  id: string;
  title: string | null;
  storage_path: string;
  duration_sec: number | null;
  transcript_json: { words: Word[] } | null;
  transcript_ar_json: { words: Word[] } | null;
};
type DbCard = ClipCard & { recording_id: string | null; audio_start_sec: number | null; audio_end_sec: number | null; clip_path: string | null };

async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function load() {
  const recs = await fetchAll<Rec>("recordings", "id,title,storage_path,duration_sec,transcript_json,transcript_ar_json");
  const cards = await fetchAll<DbCard>(
    "cards",
    "id,translit_nikud,arabic_script,hebrew_meaning,recording_id,audio_start_sec,audio_end_sec,clip_path"
  );
  // Both hearings of a recording are searched: the mixed one catches what the teacher
  // says inside Hebrew, the Arabic one is much cleaner on the Arabic itself.
  const indexed = recs.flatMap((rec) =>
    [rec.transcript_json?.words, rec.transcript_ar_json?.words]
      .filter((w): w is Word[] => (w?.length ?? 0) > 3)
      .map((words) => ({ rec, idx: indexRecording(words) }))
  );
  return { recs, cards, indexed };
}

const CACHE = join(tmpdir(), "yalla-auto-clip");
const RATE = 16000;
const MODEL = "whisper-large-v3";
mkdirSync(CACHE, { recursive: true });

async function recordingPcm(rec: Rec): Promise<Buffer> {
  const out = join(CACHE, `${rec.id}.pcm`);
  if (!existsSync(out)) {
    const src = join(CACHE, `${rec.id}.src`);
    const { data, error } = await sb.storage.from("recordings").download(rec.storage_path);
    if (error || !data) throw new Error(`download ${rec.id}: ${error?.message}`);
    writeFileSync(src, Buffer.from(await data.arrayBuffer()));
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", String(RATE), "-f", "s16le", out]);
  }
  return readFileSync(out);
}

function wav(pcm: Buffer): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Whisper in forced Arabic, waiting out the rate limit. */
async function hear(pcm: Buffer): Promise<Word[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY!, maxRetries: 0 });
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = (await groq.audio.transcriptions.create({
        file: await toFile(wav(pcm), "audio.wav"),
        model: MODEL,
        language: "ar",
        temperature: 0,
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
      })) as unknown as { words?: Word[] };
      return (res.words ?? []).map((w) => ({ word: w.word.trim(), start: w.start, end: w.end })).filter((w) => w.word);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (err.status !== 429 && (err.status ?? 500) < 500) throw e;
      const m = (err.message ?? "").match(/try again in (?:(\d+)h)?(?:(\d+)m)?(\d+(?:\.\d+)?)s/);
      const wait = m ? (Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3])) * 1000 + 2000 : 30_000;
      console.log(`  waiting ${Math.ceil(wait / 1000)}s (${err.status})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("gave up after 30 attempts");
}

const CHUNK_SEC = 300;
const OVERLAP_SEC = 2;

async function hearRecordings(recs: Rec[]) {
  for (const rec of recs) {
    if (rec.transcript_ar_json || (rec.duration_sec ?? 0) < 1) continue;
    const pcm = await recordingPcm(rec);
    const total = pcm.length / (RATE * 2);
    const words: Word[] = [];
    for (let from = 0; from < total; from += CHUNK_SEC) {
      const begin = Math.max(0, from - OVERLAP_SEC);
      const part = pcm.subarray(Math.floor(begin * RATE) * 2, Math.floor(Math.min(total, from + CHUNK_SEC) * RATE) * 2);
      for (const w of await hear(part)) {
        const start = w.start + begin;
        if (start >= from) words.push({ word: w.word, start, end: w.end + begin });
      }
    }
    const { error } = await sb.from("recordings").update({ transcript_ar_json: { words } }).eq("id", rec.id);
    if (error) throw error;
    console.log(`✓ ${rec.title ?? rec.id} ${Math.round(total)}s → ${words.length} words`);
  }
}

const PER_CARD = 3;
const MIN_SIM = 0.72;
const BATCH_SEC = 300;
const GAP_SEC = 1.5;
const heardFile = join(CACHE, "heard.json");

type Pick = { card: DbCard; rec: Rec; c: Candidate; range: { start: number; end: number }; key: string };

function picksFor(card: DbCard, indexed: Awaited<ReturnType<typeof load>>["indexed"], rejected: Map<string, { recording_id: string; start_sec: number; end_sec: number }[]>): Pick[] {
  const all: Pick[] = [];
  for (const { rec, idx } of indexed) {
    for (const c of findCandidates(card, idx, PER_CARD)) {
      if (c.sim < MIN_SIM) continue;
      const range = clipRange(c);
      const no = rejected.get(card.id) ?? [];
      if (no.some((r) => r.recording_id === rec.id && range.start < Number(r.end_sec) && Number(r.start_sec) < range.end)) continue;
      all.push({ card, rec, c, range, key: `${rec.id}:${range.start.toFixed(2)}:${range.end.toFixed(2)}` });
    }
  }
  all.sort((a, b) => candidateScore(b.c) - candidateScore(a.c));
  const kept: Pick[] = [];
  for (const p of all) {
    // The two hearings often find the same spot.
    if (kept.some((k) => k.rec.id === p.rec.id && p.range.start < k.range.end && k.range.start < p.range.end)) continue;
    kept.push(p);
    if (kept.length === PER_CARD) break;
  }
  return kept;
}

async function writeQueue(cards: DbCard[], indexed: Awaited<ReturnType<typeof load>>["indexed"]) {
  const decided = await fetchAll<{ card_id: string; recording_id: string; start_sec: number; end_sec: number; status: string }>(
    "clip_suggestions",
    "card_id,recording_id,start_sec,end_sec,status"
  );
  const rejected = new Map<string, { recording_id: string; start_sec: number; end_sec: number }[]>();
  for (const d of decided) {
    if (d.status === "rejected") rejected.set(d.card_id, [...(rejected.get(d.card_id) ?? []), d]);
  }
  const open = cards.filter((c) => !c.clip_path && !c.recording_id);
  const picks = open.flatMap((c) => picksFor(c, indexed, rejected));
  console.log(`${open.length} cards without a clip, ${new Set(picks.map((p) => p.card.id)).size} with a candidate, ${picks.length} ranges`);

  const heard: Record<string, string> = existsSync(heardFile) ? JSON.parse(readFileSync(heardFile, "utf8")) : {};
  const todo = [...new Map(picks.filter((p) => !(p.key in heard)).map((p) => [p.key, p])).values()];
  const pcmCache = new Map<string, Buffer>();
  const gap = Buffer.alloc(Math.floor(GAP_SEC * RATE) * 2);
  let done = 0;
  while (done < todo.length) {
    const parts: Buffer[] = [];
    const batch: { key: string; from: number; to: number }[] = [];
    let t = 0;
    while (done < todo.length && t < BATCH_SEC) {
      const p = todo[done++];
      if (!pcmCache.has(p.rec.id)) {
        if (pcmCache.size > 12) pcmCache.clear();
        pcmCache.set(p.rec.id, await recordingPcm(p.rec));
      }
      const end = Math.min(p.range.end, p.range.start + 12);
      const slice = pcmCache.get(p.rec.id)!.subarray(Math.floor(p.range.start * RATE) * 2, Math.floor(end * RATE) * 2);
      batch.push({ key: p.key, from: t, to: t + slice.length / (RATE * 2) });
      parts.push(slice, gap);
      t += slice.length / (RATE * 2) + GAP_SEC;
    }
    const words = await hear(Buffer.concat(parts));
    for (const b of batch) {
      heard[b.key] = words.filter((w) => w.start >= b.from - 0.3 && w.start < b.to + 0.4).map((w) => w.word).join(" ");
    }
    writeFileSync(heardFile, JSON.stringify(heard));
    console.log(`heard ${done}/${todo.length}`);
    await saveSuggestions(picks, heard);
  }
  await saveSuggestions(picks, heard);
}

async function saveSuggestions(picks: Pick[], heard: Record<string, string>) {
  const rows = picks
    .filter((p) => p.key in heard)
    .map((p) => {
      const text = heard[p.key];
      const score = heardScore(p.card, text);
      return {
        card_id: p.card.id,
        recording_id: p.rec.id,
        start_sec: Number(p.range.start.toFixed(2)),
        end_sec: Number(p.range.end.toFixed(2)),
        confidence: Number(finalConfidence(p.c, score).toFixed(3)),
        signals: {
          matched: p.c.text,
          sim: Number(p.c.sim.toFixed(2)),
          heard: text.slice(0, 160),
          heard_score: Number(score.toFixed(2)),
          meaning_near: p.c.meaningNear,
          repeats: p.c.repeats,
          isolated: p.c.isolated,
        },
      };
    });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("clip_suggestions").upsert(rows.slice(i, i + 500), { onConflict: "card_id,recording_id,start_sec" });
    if (error) throw error;
  }
}

function evaluate(cards: DbCard[], indexed: Awaited<ReturnType<typeof load>>["indexed"]) {
  // The teacher says a word several times, so a pick elsewhere isn't wrong. What the
  // hand-made clips can measure: inside their own recording, is that range found and
  // how well is it ranked, and how far off are the edges.
  const gold = cards.filter((c) => c.recording_id && Number(c.audio_end_sec) > Number(c.audio_start_sec));
  let inRec = 0, top1 = 0, top4 = 0;
  const startErr: number[] = [], endErr: number[] = [], misses: string[] = [];
  for (const g of gold) {
    const hit = indexed.find((x) => x.rec.id === g.recording_id);
    if (!hit) continue;
    inRec++;
    const s = Number(g.audio_start_sec), e = Number(g.audio_end_sec);
    const cands = findCandidates(g, hit.idx, 4);
    const at = cands.findIndex((c) => { const r = clipRange(c); return r.start < e && s < r.end; });
    if (at === 0) top1++;
    if (at >= 0) {
      top4++;
      const r = clipRange(cands[at]);
      startErr.push(Math.abs(r.start - s));
      endErr.push(Math.abs(r.end - e));
    } else {
      const heard = hit.idx.words.filter((w) => w.end >= s - 0.5 && w.start <= e + 0.5).map((w) => w.word).join(" ");
      misses.push(`  ${g.translit_nikud} | ${g.arabic_script} | heard: ${heard} | top: ${cands[0]?.text ?? "—"}`);
    }
  }
  const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
  console.log({ gold: gold.length, inRec, top1, top4, startErrMedian: median(startErr), endErrMedian: median(endErr) });
  console.log("not found:\n" + misses.join("\n"));
}

async function main() {
  const { recs, cards, indexed } = await load();
  if (process.argv.includes("--eval")) return evaluate(cards, indexed);
  if (process.argv.includes("--hear")) await hearRecordings(recs);
  if (process.argv.includes("--write")) {
    const fresh = process.argv.includes("--hear") ? await load() : { indexed };
    await writeQueue(cards, fresh.indexed);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
