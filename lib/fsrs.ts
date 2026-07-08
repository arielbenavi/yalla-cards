import { fsrs, generatorParameters, Rating, State, type Card as FsrsCard, type Grade } from "ts-fsrs";

export type CardSrsRow = {
  id: string;
  card_id: string;
  direction: "he_to_ar" | "ar_to_he";
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

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export function rowToFsrsCard(row: CardSrsRow): FsrsCard {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

export function fsrsCardToRow(card: FsrsCard) {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function scheduleReview(row: CardSrsRow, rating: Grade, now = new Date()) {
  const current = rowToFsrsCard(row);
  const recordLog = scheduler.repeat(current, now);
  const { card, log } = recordLog[rating];
  return {
    cardUpdate: fsrsCardToRow(card),
    logInsert: {
      rating: log.rating,
      state: log.state,
      due: log.due.toISOString(),
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      last_elapsed_days: log.last_elapsed_days,
      scheduled_days: log.scheduled_days,
      learning_steps: log.learning_steps,
    },
  };
}

export { Rating, State };
