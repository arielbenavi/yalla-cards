// "The same word in another sentence" on the back of a word card (idea from Speak's
// Smart Review, docs/learning-plan-2026-11.md). Only sentences already in the deck,
// never generated Arabic. Pure and offline: it works from the deck on the device.

type ExampleCard = {
  card_id: string;
  item_type: string;
  arabic_script: string | null;
  translit_nikud: string;
  hebrew_meaning: string;
  course_verified?: boolean | null;
};

export function skeleton(word: string): string {
  return word
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^ء-ي]/g, "");
}

// The same word with an attached article or conjunction still counts: البيت, وبيت.
export function forms(word: string): string[] {
  const out = [word];
  for (const prefix of ["ال", "و", "ب", "ل", "وال", "بال"]) {
    if (word.startsWith(prefix) && word.length - prefix.length >= 3) out.push(word.slice(prefix.length));
  }
  return out;
}

export type ExampleIndex = Map<string, ExampleCard[]>;

export function buildExampleIndex(cards: ExampleCard[]): ExampleIndex {
  const index: ExampleIndex = new Map();
  const seen = new Set<string>();
  for (const c of cards) {
    if (c.item_type === "word" || !c.arabic_script || seen.has(c.card_id)) continue;
    seen.add(c.card_id);
    const words = c.arabic_script.split(/[\s،,.؟?!:;/]+/).map(skeleton).filter(Boolean);
    // A paragraph is not an example: it filled the back of the card (Ariel, 2026-11-07)
    if (words.length < 3 || words.length > 12) continue;
    for (const key of new Set(words.flatMap(forms))) {
      const list = index.get(key);
      if (list) list.push(c);
      else index.set(key, [c]);
    }
  }
  return index;
}

/** A sentence holding this word, a different one each day. Null for a non-word or a word in no sentence. */
export function exampleFor(card: ExampleCard, index: ExampleIndex, day: number): ExampleCard | null {
  if (card.item_type !== "word" || !card.arabic_script) return null;
  const parts = card.arabic_script.trim().split(/\s+/);
  if (parts.length !== 1) return null;
  const key = skeleton(parts[0]);
  if (key.length < 3) return null;
  const list = (index.get(key) ?? []).filter((c) => c.card_id !== card.card_id);
  // A sentence from the book beats one from anywhere else
  const book = list.filter((c) => c.course_verified);
  const pool = book.length ? book : list;
  return pool.length ? pool[day % pool.length] : null;
}
