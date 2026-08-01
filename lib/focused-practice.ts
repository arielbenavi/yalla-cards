/**
 * Card selection for focused practice (note ac2ed4f2).
 * Parameters come from docs/research-2026-07-31-four-features.md.
 *
 * Pure functions — no DB access — so the weighting is testable on fixtures.
 */

export const SESSION_SIZES = {
  15: { items: 16, label: "15 דקות" },
  20: { items: 22, label: "20 דקות" },
  30: { items: 30, label: "30 דקות" },
} as const;

export type SessionMinutes = keyof typeof SESSION_SIZES;

/** Hard ceilings from the research: never exceed these regardless of duration. */
export const HARD_ITEM_CAP = 36;
export const HARD_ATTEMPT_CAP = 80;

/** Hours a card is ineligible after being practiced here, bounding the gap
 *  between FSRS's model and the learner's real memory state. */
export const COOLDOWN_HOURS = 12;

export type Candidate = {
  card_srs_id: string;
  card_id: string;
  lesson_id: string | null;
  lesson_date: string | null;
  /** FSRS fields — read only */
  stability: number;
  difficulty: number;
  lapses: number;
  state: number;
  due: string;
  last_review: string | null;
  /** review_log history */
  last_again_at: string | null;
  last_hard_at: string | null;
  /** focused_practice_log */
  last_focused_at: string | null;
};

const DAY_MS = 86_400_000;
const daysSince = (iso: string | null, now: number) =>
  iso === null ? Infinity : (now - new Date(iso).getTime()) / DAY_MS;

/**
 * FSRS retrievability: the probability the card is recallable right now.
 * FSRS-5 forgetting curve, R(t) = (1 + FACTOR · t/S)^DECAY.
 */
const DECAY = -0.5;
const FACTOR = 19 / 81;
export function retrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(0, elapsedDays);
  return Math.pow(1 + FACTOR * (t / stability), DECAY);
}

/**
 * Eligibility, per the research. Note the two exclusions that matter most:
 *
 * - A card due today that has not had its official review yet is excluded.
 *   Drilling it first would inflate the success FSRS then records, and the
 *   scheduler would have no idea a retrieval attempt happened minutes earlier.
 * - New/unseen cards are excluded — focused practice is for material that has
 *   been struggled with, not an alternative way to introduce cards.
 */
export function isEligible(c: Candidate, now = Date.now()): boolean {
  if (c.state === 0) return false; // New — belongs to the daily queue
  if (daysSince(c.last_focused_at, now) * 24 < COOLDOWN_HOURS) return false;

  const dueToday = new Date(c.due).getTime() <= now;
  const reviewedSinceDue =
    c.last_review !== null && new Date(c.last_review).getTime() >= new Date(c.due).getTime();
  if (dueToday && !reviewedSinceDue) return false;

  const againDays = daysSince(c.last_again_at, now);
  const hardDays = daysSince(c.last_hard_at, now);
  return againDays <= 90 || hardDays <= 45 || (c.lapses >= 2 && c.difficulty >= 7);
}

/** Exponential decay with a 21-day half-life. */
const decay21 = (days: number) => (days === Infinity ? 0 : Math.pow(0.5, days / 21));

export function priority(c: Candidate, now = Date.now()): number {
  // An Again counts fully, a Hard about a third — both fading over ~21 days
  const recentFailure = Math.min(
    1,
    decay21(daysSince(c.last_again_at, now)) * 1.0 + decay21(daysSince(c.last_hard_at, now)) * 0.35
  );

  const elapsed = daysSince(c.last_review, now);
  const memoryRisk = 1 - retrievability(c.stability, elapsed === Infinity ? 0 : elapsed);

  // FSRS difficulty runs 1–10; lapses compressed so a few don't dominate
  const chronicDifficulty = Math.min(
    1,
    ((c.difficulty - 1) / 9) * 0.6 + Math.min(1, Math.log1p(c.lapses) / Math.log(11)) * 0.4
  );

  const lessonRecency = decay21(daysSince(c.lesson_date, now));

  return (
    0.45 * recentFailure + 0.25 * memoryRisk + 0.15 * chronicDifficulty + 0.15 * lessonRecency
  );
}

function weightedSample<T>(pool: T[], weight: (t: T) => number, n: number, rand = Math.random): T[] {
  const remaining = [...pool];
  const out: T[] = [];
  while (out.length < n && remaining.length > 0) {
    const total = remaining.reduce((s, t) => s + Math.max(1e-6, weight(t)), 0);
    let r = rand() * total;
    let idx = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      r -= Math.max(1e-6, weight(remaining[i]));
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    out.push(remaining.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * Band sampling: 70% from the top-priority third, 20% from the next, 10%
 * diversity. Taking the top N outright creates a tunnel where the same words
 * recur every session and mid-difficulty cards never surface.
 */
export function selectSession(
  candidates: Candidate[],
  size: number,
  now = Date.now(),
  rand = Math.random
): Candidate[] {
  const eligible = candidates.filter((c) => isEligible(c, now));
  const scored = eligible
    .map((c) => ({ c, p: priority(c, now) }))
    .sort((a, b) => b.p - a.p);

  const third = Math.max(1, Math.ceil(scored.length / 3));
  const top = scored.slice(0, third);
  const mid = scored.slice(third, third * 2);
  const rest = scored.slice(third * 2);

  const nTop = Math.round(size * 0.7);
  const nMid = Math.round(size * 0.2);

  const picked = [
    ...weightedSample(top, (x) => x.p, nTop, rand),
    ...weightedSample(mid, (x) => x.p, nMid, rand),
    ...weightedSample(rest.length ? rest : mid, () => 1, size - nTop - nMid, rand),
  ].map((x) => x.c);

  // Top up from whatever is left if a band ran dry
  if (picked.length < size) {
    const chosen = new Set(picked.map((c) => c.card_srs_id));
    for (const { c } of scored) {
      if (picked.length >= size) break;
      if (!chosen.has(c.card_srs_id)) picked.push(c);
    }
  }

  return constrainedShuffle(picked.slice(0, Math.min(size, HARD_ITEM_CAP)), rand);
}

/**
 * Constrained shuffle rather than pure random: the research finds interleaving
 * helps discrimination but heavy mixing overloads, so cap runs from one lesson
 * at two rather than blocking or fully randomising.
 */
export function constrainedShuffle(items: Candidate[], rand = Math.random): Candidate[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const out: Candidate[] = [];
  while (pool.length) {
    const lastTwo = out.slice(-2);
    const wouldRunOn =
      lastTwo.length === 2 &&
      lastTwo[0].lesson_id === lastTwo[1].lesson_id &&
      lastTwo[0].lesson_id !== null;

    let idx = 0;
    if (wouldRunOn) {
      const alt = pool.findIndex((c) => c.lesson_id !== lastTwo[1].lesson_id);
      if (alt !== -1) idx = alt;
    }
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * Where a failed item goes back into the queue. The research settles on fixed
 * gaps rather than expanding retrieval, which shows no consistent advantage in
 * vocabulary studies, and warns that too-tight repeats measure working memory
 * rather than long-term recall.
 */
export function reinsertOffset(outcome: number, attemptIndex: number, rand = Math.random): number | null {
  if (outcome === 1) return attemptIndex === 1 ? 2 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3);
  if (outcome === 2) return 6 + Math.floor(rand() * 5);
  return null; // Good / Easy — done for this session
}

/** Four presentations is the ceiling; past that, stop hammering the item. */
export const MAX_PRESENTATIONS = 4;
