// The daily review queue as a pure function, for the iPhone app, which has to
// build it with no network. It mirrors the default branch of
// app/api/review/queue/route.ts — change the two together:
//
//   - due cards (state ≠ New, due ≤ now), oldest due first
//   - then new cards (state = New, due ≤ now), newest lesson first and `due ASC`
//     within a lesson, up to `newCardsPerDay` minus the new cards already
//     reviewed today
//   - a card rated Easy today is left out
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

  const newDoneToday = today.filter((r) => r.state === STATE_NEW).length;
  const remainingNew = Math.max(0, config.newCardsPerDay - newDoneToday);
  const easyToday = new Set(today.filter((r) => r.rating === RATING_EASY).map((r) => r.card_srs_id));

  const nowMs = now.getTime();
  const open = cards.filter((c) => !easyToday.has(c.card_srs_id) && new Date(c.srs.due).getTime() <= nowMs);
  const byDue = (a: DeckCard, b: DeckCard) => new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime();

  const due = open.filter((c) => c.srs.state !== STATE_NEW).sort(byDue);
  const fresh =
    remainingNew > 0
      ? open
          .filter((c) => c.srs.state === STATE_NEW)
          .sort(byDue)
          // Array.prototype.sort is stable, so `due ASC` holds inside a lesson
          .sort((a, b) => b.lesson_date.localeCompare(a.lesson_date))
          .slice(0, remainingNew)
      : [];

  return [...due, ...fresh];
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
