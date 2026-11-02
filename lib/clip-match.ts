// Finds where a card is spoken in a lesson recording. Whisper hears the teacher in
// a mix of Hebrew letters and Arabic script ("קהוה" comes out as "اهوه"), so both the
// card and the transcript are reduced to one sound alphabet and compared by a
// weighted edit distance. Pure functions, used by scripts/auto-clip.ts.

export type Word = { word: string; start: number; end: number };

export type ClipCard = {
  id: string;
  translit_nikud: string;
  arabic_script: string | null;
  hebrew_meaning: string;
};

export type Candidate = {
  start: number;
  end: number;
  from: number; // index of the first transcript word
  to: number; // index of the last transcript word
  text: string;
  sim: number; // 0–1, how close the sounds are
  meaningNear: boolean; // the Hebrew meaning is said close by
  repeats: number; // how many more times it is said within 20s
  consonants: number;
  isMeaningItself: boolean; // the match is the Hebrew word, not the Arabic one
  isolated: number; // 0–2: silence before and after, so it cuts cleanly
};

const SOUND: Record<string, string> = {
  // Hebrew letters as the deck uses them
  א: "a", ע: "a", ה: "a", ב: "b", ג: "j", ד: "d", ו: "w", ז: "z", ח: "h", ט: "t", י: "y",
  כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s", פ: "f", ף: "f", צ: "c",
  ץ: "c", ק: "q", ר: "r", ש: "x", ת: "t",
  // Arabic
  ا: "a", أ: "a", إ: "a", آ: "a", ء: "a", ئ: "a", ؤ: "a", ى: "a", ع: "a", ه: "a", ة: "a",
  غ: "g", ب: "b", ت: "t", ث: "t", ج: "j", ح: "h", خ: "h", د: "d", ذ: "d", ر: "r", ز: "z",
  س: "s", ش: "x", ص: "c", ض: "c", ط: "t", ظ: "z", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
  ن: "n", و: "w", ي: "y",
};

// Sounds Whisper (and the dialect) trade for each other.
const NEAR: Record<string, string> = {
  qa: "1", aq: "1", // ق is a glottal stop in Palestinian: قهوة → اهوه
  qk: "1", kq: "1",
  hk: "1", kh: "1", // ח' / כ
  ha: "1", ah: "1",
  ga: "1", ag: "1", // ע' / ע
  sc: "1", cs: "1", tc: "1", ct: "1", dc: "1", cd: "1", zc: "1", cz: "1", // emphatics
  sz: "1", zs: "1", dz: "1", zd: "1", st: "1", ts: "1", dt: "1", td: "1", // ث ذ
  jz: "1", zj: "1", xs: "1", sx: "1",
  bf: "1", fb: "1",
};

// Whisper writes spoken numbers as digits.
const NUMBERS: Record<string, string> = {
  "0": "صفر", "1": "واحد", "2": "تنين", "3": "تلاتة", "4": "أربعة", "5": "خمسة", "6": "ستة", "7": "سبعة",
  "8": "تمانية", "9": "تسعة", "10": "عشرة", "11": "احدعش", "12": "اطنعش", "13": "تلطعش", "14": "أربعطعش",
  "15": "خمسطعش", "16": "ستطعش", "17": "سبعطعش", "18": "تمنطعش", "19": "تسعطعش", "20": "عشرين",
  "30": "تلاتين", "40": "أربعين", "50": "خمسين", "60": "ستين", "70": "سبعين", "80": "تمانين", "90": "تسعين",
  "100": "مية", "1000": "ألف",
};

function spellNumber(text: string): string {
  const digits = text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[^\d]/g, "");
  return digits && digits.length === text.replace(/[^\p{L}\p{N}]/gu, "").length ? (NUMBERS[digits] ?? text) : text;
}

/** One sound alphabet for both scripts. "(א)ל" is dropped: the teacher may not say it. */
export function soundKey(text: string): string {
  const cleaned = spellNumber(text)
    .replace(/\(א?ל?\)|\(ال\)/g, "")
    .normalize("NFD")
    .replace(/[֑-ׇً-ٰٟ]/g, "");
  let out = "";
  for (const ch of cleaned) {
    const s = SOUND[ch];
    if (s) out += s;
  }
  return out;
}

export function soundWords(text: string): string[] {
  return text
    .split(/[\s/,.;:!?؟،\-–—"'׳״]+/)
    .map(soundKey)
    .filter((k) => k.length > 0);
}

function subCost(a: string, b: string): number {
  if (a === b) return 0;
  return NEAR[a + b] ? 0.4 : 1;
}

function indelCost(c: string): number {
  // Vowel letters and glottals come and go between the scripts.
  return c === "a" || c === "w" || c === "y" ? 0.4 : 1;
}

export function soundSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  prev[0] = 0;
  for (let j = 1; j <= b.length; j++) prev[j] = prev[j - 1] + indelCost(b[j - 1]);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = prev[0] + indelCost(a[i - 1]);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j - 1] + subCost(a[i - 1], b[j - 1]),
        prev[j] + indelCost(a[i - 1]),
        cur[j - 1] + indelCost(b[j - 1])
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  const weight = (s: string) => [...s].reduce((n, c) => n + indelCost(c), 0);
  return Math.max(0, 1 - prev[b.length] / Math.max(weight(a), weight(b), 1));
}

function strip(text: string): string {
  return text.normalize("NFD").replace(/[֑-ׇ]/g, "").replace(/[^א-ת]/g, "");
}

function meaningWords(meaning: string): string[] {
  const stop = new Set(["של", "את", "על", "או", "זה", "זו", "זאת", "אני", "אתה", "הוא", "היא", "לא", "כן", "מה", "יש", "אין"]);
  return meaning
    .replace(/\([^)]*\)/g, " ")
    .split(/[\s/,.;:!?\-–—"']+/)
    .map(strip)
    .filter((w) => w.length >= 2 && !stop.has(w));
}

export type IndexedRecording = {
  words: Word[];
  keys: string[];
  hebrew: string[];
  byKey: Map<string, number[]>;
};

export function indexRecording(words: Word[]): IndexedRecording {
  const keys = words.map((w) => soundKey(w.word));
  const hebrew = words.map((w) => strip(w.word));
  const byKey = new Map<string, number[]>();
  keys.forEach((k, i) => {
    if (!k) return;
    const list = byKey.get(k);
    if (list) list.push(i);
    else byKey.set(k, [i]);
  });
  return { words, keys, hebrew, byKey };
}

const SEED_SIM = 0.62;

/** Every place in this recording that sounds like the card, best first. */
export function findCandidates(card: ClipCard, rec: IndexedRecording, limit = 4): Candidate[] {
  const targets = [card.translit_nikud, card.arabic_script ?? ""]
    .flatMap((t) => t.split(/\s*\/\s*/)) // "שַנְטַה / שַנְתַה" are two spellings of one word
    .map((t) => ({ whole: soundKey(t), parts: soundWords(t) }))
    .filter((t) => t.whole.length >= 2);
  if (!targets.length) return [];

  const meaning = meaningWords(card.hebrew_meaning);
  const out = new Map<string, Candidate>();

  for (const target of targets) {
    // Seed on the longest words of the target: short ones match everywhere.
    const seedParts = [...target.parts.keys()]
      .sort((a, b) => target.parts[b].length - target.parts[a].length)
      .slice(0, 3);
    const seeds = new Set<number>();
    for (const p of seedParts) {
      for (const [key, positions] of rec.byKey) {
        if (Math.abs(key.length - target.parts[p].length) > 3) continue;
        if (soundSimilarity(key, target.parts[p]) >= SEED_SIM) {
          for (const pos of positions) seeds.add(pos - p);
        }
      }
    }
    const n = target.parts.length;
    for (const seed of seeds) {
      const sizes = n === 1 ? [1, 2] : [n - 1, n, n + 1, n + 2];
      for (const offset of n === 1 ? [0] : [-1, 0, 1]) {
        for (const size of sizes) {
          const from = seed + offset;
          const to = from + size - 1;
          if (from < 0 || to >= rec.words.length || size < 1) continue;
          const key = rec.keys.slice(from, to + 1).join("");
          const sim = soundSimilarity(key, target.whole);
          if (sim < 0.5) continue;
          const id = `${from}:${to}`;
          const prior = out.get(id);
          if (prior && prior.sim >= sim) continue;
          out.set(id, {
            start: rec.words[from].start,
            end: rec.words[to].end,
            from,
            to,
            text: rec.words.slice(from, to + 1).map((w) => w.word).join(" "),
            sim,
            meaningNear: meaningIsNear(rec, from, to, meaning),
            repeats: 0,
            consonants: [...target.whole].filter((c) => c !== "a" && c !== "w" && c !== "y").length,
            isMeaningItself: rec.hebrew.slice(from, to + 1).some((w) => meaning.includes(w)),
            isolated:
              (from === 0 || rec.words[from].start - rec.words[from - 1].end >= 0.2 ? 1 : 0) +
              (to === rec.words.length - 1 || rec.words[to + 1].start - rec.words[to].end >= 0.2 ? 1 : 0),
          });
        }
      }
    }
  }

  const all = [...out.values()];
  for (const c of all) {
    c.repeats = all.filter(
      (o) => o !== c && o.sim >= c.sim - 0.15 && Math.abs(o.start - c.start) <= 20 && o.to < c.from
    ).length;
  }
  return dropOverlaps(all.sort((a, b) => candidateScore(b) - candidateScore(a))).slice(0, limit);
}

function meaningIsNear(rec: IndexedRecording, from: number, to: number, meaning: string[]): boolean {
  if (!meaning.length) return false;
  const lo = Math.max(0, from - 7);
  const hi = Math.min(rec.words.length - 1, to + 7);
  for (let i = lo; i <= hi; i++) {
    if (i >= from && i <= to) continue;
    if (Math.abs(rec.words[i].start - rec.words[from].start) > 8) continue;
    const w = rec.hebrew[i];
    if (!w) continue;
    if (meaning.includes(w) || meaning.includes(w.replace(/^[הו]/, ""))) return true;
  }
  return false;
}

function dropOverlaps(sorted: Candidate[]): Candidate[] {
  const kept: Candidate[] = [];
  for (const c of sorted) {
    if (!kept.some((k) => c.start < k.end && k.start < c.end)) kept.push(c);
  }
  return kept;
}

/** Ranks ranges before the second hearing. Set by hand and checked with scripts/auto-clip.ts --eval. */
export const WEIGHTS = { bias: -9, sim: 9, meaningNear: 1.5, repeats: 0.5, length: 0.25, meaningItself: -1.5, isolated: 0.4 };

export function candidateScore(c: Candidate, w = WEIGHTS): number {
  return (
    w.bias +
    w.sim * c.sim +
    w.meaningNear * (c.meaningNear ? 1 : 0) +
    w.repeats * Math.min(c.repeats, 3) +
    w.length * Math.min(c.consonants, 10) +
    w.meaningItself * (c.isMeaningItself ? 1 : 0) +
    w.isolated * c.isolated
  );
}

/** Whisper's word times run tight: a little air on both sides so the word isn't clipped. */
export function clipRange(c: Candidate): { start: number; end: number } {
  return { start: Math.max(0, c.start - 0.1), end: c.end + 0.15 };
}

/** How well a fresh hearing of the cut clip contains the card: 0–1. */
export function heardScore(card: ClipCard, heard: string): number {
  const words = heard.split(/\s+/).map(soundKey).filter(Boolean);
  let best = 0;
  for (const raw of [card.translit_nikud, card.arabic_script ?? ""].flatMap((t) => t.split(/\s*\/\s*/))) {
    const whole = soundKey(raw);
    if (whole.length < 2) continue;
    const n = soundWords(raw).length;
    for (let size = Math.max(1, n - 1); size <= n + 1; size++) {
      for (let i = 0; i + size <= words.length; i++) {
        best = Math.max(best, soundSimilarity(words.slice(i, i + size).join(""), whole));
      }
    }
  }
  return best;
}

/**
 * The number the queue sorts by: how likely this range is the card, 0–1. A fresh
 * hearing of the cut clip weighs most. On the 143 hand-made clips it read back the
 * card (≥ 0.85) for 73% of them, and for 13% of the same clips moved 6s away.
 */
export function finalConfidence(c: Candidate, heard: number): number {
  const score =
    -5.2 +
    2.2 * c.sim +
    3.4 * heard +
    0.8 * (c.meaningNear ? 1 : 0) +
    0.25 * Math.min(c.repeats, 3) +
    0.15 * Math.min(c.consonants, 8) +
    0.2 * c.isolated -
    1 * (c.isMeaningItself ? 1 : 0);
  return 1 / (1 + Math.exp(-score));
}
