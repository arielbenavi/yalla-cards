// The daily review queue as a pure function, for the iPhone app, which has to
// build it with no network. It mirrors the default branch of
// app/api/review/queue/route.ts — change the two together:
//
//   - due cards (state ≠ New, due ≤ now), oldest due first
//   - then new cards (state = New, due ≤ now), newest lesson first and `due ASC`
//     within a lesson, up to `newCardsPerDay` minus the new cards already
//     reviewed today
//   - a card rated Easy today is left out
//   - long items (sentences) are at most `newLongShare` of the day's new cards,
//     and the queue spreads them out instead of letting them bunch up
//
// Reads FSRS state only. Nothing here writes it.
import { config } from "@/lib/config";

const STATE_NEW = 0;
const RATING_EASY = 4;

export type SrsState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

export type DeckCard = {
  card_srs_id: string;
  card_id: string;
  direction: "he_to_ar" | "ar_to_he";
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
  clip_path: string | null;
  audio_start_sec: number | null;
  audio_end_sec: number | null;
  /** The lesson's date, "" for a card with no lesson (those rank last). */
  lesson_date: string;
  srs: SrsState;
};

/** One review, as review_log records it: `state` is the state before it. */
export type ReviewEvent = {
  card_srs_id: string;
  rating: number;
  state: number;
  reviewed_at: string;
};

export function dailyQueue(cards: DeckCard[], reviews: ReviewEvent[], now = new Date()): DeckCard[] {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const today = reviews.filter((r) => new Date(r.reviewed_at) >= startOfDay);

  const newToday = today.filter((r) => r.state === STATE_NEW);
  const remainingNew = Math.max(0, config.newCardsPerDay - newToday.length);
  const text = new Map(cards.map((c) => [c.card_srs_id, c.translit_nikud]));
  const longNewToday = newToday.filter((r) => isLong(text.get(r.card_srs_id))).length;
  const easyToday = new Set(today.filter((r) => r.rating === RATING_EASY).map((r) => r.card_srs_id));

  const nowMs = now.getTime();
  const open = cards.filter((c) => !easyToday.has(c.card_srs_id) && new Date(c.srs.due).getTime() <= nowMs);
  // Cards inserted in one batch share a `due`; the id breaks the tie the same way Postgres does
  const byDue = (a: DeckCard, b: DeckCard) =>
    new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime() || (a.card_srs_id < b.card_srs_id ? -1 : a.card_srs_id > b.card_srs_id ? 1 : 0);

  const due = open.filter((c) => c.srs.state !== STATE_NEW).sort(byDue);
  const fresh = pickNew(
    open
      .filter((c) => c.srs.state === STATE_NEW)
      .sort(byDue)
      // Array.prototype.sort is stable, so `due ASC` holds inside a lesson
      .sort((a, b) => b.lesson_date.localeCompare(a.lesson_date)),
    remainingNew,
    longNewToday,
    (c) => c.translit_nikud
  );

  return [...spreadLong(due, (c) => c.translit_nikud), ...spreadLong(fresh, (c) => c.translit_nikud)];
}

/** A sentence or long chunk: `longItemWords` words or more. */
export function isLong(text: string | null | undefined): boolean {
  return (text ?? "").trim().split(/\s+/).filter(Boolean).length >= config.longItemWords;
}

/**
 * The day's new cards from candidates already in introduction order: up to
 * `remaining`, of which long ones only while the day's long share
 * (`newLongShare` of `newCardsPerDay`, minus `longDoneToday`) lasts. Skipped
 * long cards keep their place for the next day. Shared with the server route.
 */
export function pickNew<T>(sorted: T[], remaining: number, longDoneToday: number, text: (c: T) => string | null | undefined): T[] {
  let longLeft = Math.max(0, Math.round(config.newCardsPerDay * config.newLongShare) - longDoneToday);
  const out: T[] = [];
  for (const c of sorted) {
    if (out.length >= remaining) break;
    if (isLong(text(c))) {
      if (longLeft <= 0) continue;
      longLeft--;
    }
    out.push(c);
  }
  return out;
}

/**
 * Same cards, long ones placed evenly among the short ones (each group keeps
 * its own order), so a session never turns into a run of sentences. Order only.
 */
export function spreadLong<T>(list: T[], text: (c: T) => string | null | undefined): T[] {
  const long = list.filter((c) => isLong(text(c)));
  const short = list.filter((c) => !isLong(text(c)));
  if (!long.length || !short.length) return list;
  const out: T[] = [];
  const gap = short.length / (long.length + 1);
  let s = 0;
  for (let i = 0; i < long.length; i++) {
    const until = Math.round(gap * (i + 1));
    while (s < until) out.push(short[s++]);
    out.push(long[i]);
  }
  while (s < short.length) out.push(short[s++]);
  return out;
}

/** Cards in learning steps that come back later today — shown on the done screen. */
export function laterToday(cards: DeckCard[], now = new Date()): DeckCard[] {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return cards.filter((c) => {
    const due = new Date(c.srs.due).getTime();
    return c.srs.state !== STATE_NEW && due > now.getTime() && due <= end.getTime();
  });
}
