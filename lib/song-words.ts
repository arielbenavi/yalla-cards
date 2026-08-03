// Keeping song_word_srs pointed at the right word when lyrics change.
//
// `song_word_srs.word_index` is a *positional* index into the flattened
// `lyrics_parsed[].words` array — `app/api/songs/[id]/review/route.ts` resolves a
// review row with `allWords[row.word_index]`. That makes every edit to the lyrics
// a data-integrity problem rather than a content edit: inserting one missing gloss
// near the top shifts every later index by one and silently re-points existing
// review history at the wrong word. There are 150 such rows today.
//
// So lyric edits go through `remapWordIndices`, which computes where each old
// word ended up and returns the index moves that keep the SRS rows correct. It
// refuses rather than guesses: if an old word is gone or the order changed, the
// caller is told, and no write happens.

export type LyricWord = { ar?: string; he?: string; translit?: string };
export type LyricLine = { line?: string; words?: LyricWord[]; timestamp?: string };

export const flattenWords = (lines: LyricLine[]): LyricWord[] =>
  lines.flatMap((l) => l.words ?? []);

/** Comparison key — diacritics and punctuation vary between sources. */
const key = (w: LyricWord): string =>
  (w.ar ?? "")
    .normalize("NFC")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[^ء-ي]/g, "");

export type Remap =
  | { ok: true; moves: Map<number, number>; added: number }
  | { ok: false; reason: string };

/**
 * Maps every old word position to its position in the new list.
 *
 * The match is order-preserving: old words must appear in the new list in the
 * same relative order, which is what an *additive* edit guarantees. Anything
 * else — a deletion, a reorder, a changed spelling — fails the whole remap,
 * because a partially-correct index is worse than a refused write.
 */
export function remapWordIndices(oldWords: LyricWord[], newWords: LyricWord[]): Remap {
  const moves = new Map<number, number>();
  let n = 0;

  for (let o = 0; o < oldWords.length; o++) {
    const want = key(oldWords[o]);
    let found = -1;
    for (let i = n; i < newWords.length; i++) {
      if (key(newWords[i]) === want) {
        found = i;
        break;
      }
    }
    if (found === -1) {
      return {
        ok: false,
        reason: `המילה "${oldWords[o].ar ?? ""}" (מיקום ${o}) לא נמצאה ברשימה החדשה, או שהסדר השתנה`,
      };
    }
    moves.set(o, found);
    n = found + 1;
  }

  return { ok: true, moves, added: newWords.length - oldWords.length };
}

/**
 * Rows must be updated so that no two rows collide on the way. Indices only ever
 * grow under an additive edit, so writing the highest index first means a row
 * never lands on a position still occupied by a row yet to move.
 */
export function orderedMoves(moves: Map<number, number>): [number, number][] {
  return [...moves.entries()].filter(([from, to]) => from !== to).sort((a, b) => b[1] - a[1]);
}
