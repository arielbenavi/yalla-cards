// Tapping a word inside a sentence on the back of a card: which card, if any, is
// that word. Pure and offline, it works from the deck on the device. Only cards
// already in the deck, never a generated meaning.
import { forms, skeleton } from "./deck-examples";

type WordCard = {
  card_id: string;
  arabic_script: string | null;
  translit_nikud: string;
  hebrew_meaning: string;
};

export type SentenceWord = { text: string; arabic: string | null };
export type WordIndex = { byTranslit: Map<string, WordCard[]>; byArabic: Map<string, WordCard[]> };
export type WordMatch = { cards: WordCard[]; sure: boolean };

const FINALS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
const HAS_LETTER = /[א-ת]/;
const EDGE_PUNCTUATION = /^[^א-ת(]+|[^א-ת)'׳֑-ׇً-ْ]+$/g;

/** Letters and geresh only. The optional (א)ל of the book's spelling is dropped: (א)לְבֵּית, בִּ(א)לְבֵּית. */
export function translitKey(word: string): string {
  return word
    .replace(/\([^)]*\)/g, "")
    .replace(/[׳’`]/g, "'")
    .replace(/[^א-ת']/g, "")
    .replace(/[ךםןףץ]/g, (c) => FINALS[c]);
}

/**
 * ב in a transliteration is always ب, so a pointed word's ב always takes a dagesh (b, never v).
 * A word with no nikud may be Hebrew and stays as it is. An Arabic shadda becomes the dagesh it stands for.
 */
export function fixBet(text: string): string {
  return text
    .split(/(\s+)/)
    .map((word) =>
      /[\u0591-\u05C7]/.test(word)
        ? word.replace(/ב([\u0591-\u05C7\u0651]*)/g, (_, marks: string) => {
            const m = marks.replace(/\u0651/g, "\u05BC");
            return m.includes("\u05BC") ? `ב${m}` : `ב${m}\u05BC`;
          })
        : word
    )
    .join("");
}

const letterCount = (key: string) => key.replace(/'/g, "").length;

// Attached article, preposition or conjunction, and possessive endings. Rules this
// simple miss some forms and sometimes catch a stranger, so a match through them
// is shown as "maybe".
const PREFIXES = ["אל", "בל", "ול", "על", "לל", "הל", "ו", "ב", "ל"];
const SUFFIXES = ["הם", "הן", "כם", "כן", "נא", "הא", "ו", "י", "כ", "ה"];

function stems(key: string): string[] {
  const unprefixed = [key];
  for (const p of PREFIXES) if (key.startsWith(p)) unprefixed.push(key.slice(p.length));
  const out = new Set(unprefixed);
  for (const k of unprefixed) {
    for (const s of SUFFIXES) if (k.endsWith(s)) out.add(k.slice(0, -s.length));
    if (k.endsWith("ת")) out.add(`${k.slice(0, -1)}ה`); // חַפְלֵת (בִּנְתוֹ) → חַפְלֵה
  }
  out.delete(key);
  return [...out].filter((k) => letterCount(k) >= 3);
}

/** The sentence's words. Each gets its Arabic only when both sides have the same number of words. */
export function sentenceWords(translit: string, arabic: string | null): SentenceWord[] {
  const words = translit
    .split(/\s+/)
    .filter((w) => HAS_LETTER.test(w))
    .map((w) => w.replace(EDGE_PUNCTUATION, ""));
  const arabicWords = (arabic ?? "").split(/\s+/).filter((w) => skeleton(w));
  return words.map((text, i) => ({
    text,
    arabic: arabicWords.length === words.length ? arabicWords[i].replace(/[^ء-ٰٟـ]/g, "") : null,
  }));
}

function add(map: Map<string, WordCard[]>, key: string, card: WordCard) {
  if (!key) return;
  const list = map.get(key);
  if (list) list.push(card);
  else map.set(key, [card]);
}

export function buildWordIndex(cards: WordCard[]): WordIndex {
  const index: WordIndex = { byTranslit: new Map(), byArabic: new Map() };
  const seen = new Set<string>();
  for (const c of cards) {
    if (seen.has(c.card_id) || c.translit_nikud.trim().split(/\s+/).length !== 1) continue;
    seen.add(c.card_id);
    add(index.byTranslit, translitKey(c.translit_nikud), c);
    if (c.arabic_script && c.arabic_script.trim().split(/\s+/).length === 1)
      add(index.byArabic, skeleton(c.arabic_script), c);
  }
  return index;
}

/** The word's cards, at most three. `sure` means the word itself, not a guess through its prefix or ending. */
export function lookupWord(word: SentenceWord, index: WordIndex, selfCardId: string): WordMatch {
  const key = translitKey(word.text);
  const arabicKey = word.arabic ? skeleton(word.arabic) : "";
  const pick = (lists: (WordCard[] | undefined)[]) => {
    const byId = new Map(lists.flatMap((l) => l ?? []).map((c) => [c.card_id, c]));
    byId.delete(selfCardId);
    return [...byId.values()].slice(0, 3);
  };
  const exact = pick([index.byTranslit.get(key), arabicKey ? index.byArabic.get(arabicKey) : undefined]);
  if (exact.length) return { cards: exact, sure: true };
  return {
    cards: pick([
      ...stems(key).map((k) => index.byTranslit.get(k)),
      ...(arabicKey ? forms(arabicKey).map((k) => index.byArabic.get(k)) : []),
    ]),
    sure: false,
  };
}
