// סבב צורות (beta), docs/forms-round.md: plurals of words already known, outside
// FSRS, as an A/B test. Everything here only reads card_srs and cards.
import type { SupabaseClient } from "@supabase/supabase-js";

/** The report counts reviews from this day on. */
export const FORMS_ROUND_START = "2026-11-26";
export const FORMS_ROUND_SIZE = 10;

/**
 * A words can enter the round, B words never do (the control). By the first hex
 * digit of the card's uuid, so nothing is stored.
 */
export function formsGroup(cardId: string): "A" | "B" {
  return parseInt(cardId[0], 16) % 2 === 0 ? "A" : "B";
}

const bare = (s: string) => s.replace(/[֑-ׇ]/g, "").trim();

export function hasOwnPlural(singular: string, plural: string | null): boolean {
  const p = bare(plural ?? "");
  return p !== "" && p !== "—" && p !== bare(singular);
}

export type FormsWord = {
  card_id: string;
  translit_nikud: string;
  arabic_script: string | null;
  hebrew_meaning: string;
  plural_form: string;
};

export type FormsCandidate = FormsWord & { card_srs_id: string; state: number; stability: number };

type Row = {
  id: string;
  state: number;
  stability: number;
  card: {
    id: string;
    translit_nikud: string;
    arabic_script: string | null;
    hebrew_meaning: string;
    plural_form: string | null;
  };
};

/**
 * Word cards with a plural of their own whose he_to_ar card is in one of
 * `states` with at least 2 reps. Both groups; the caller filters by formsGroup.
 */
export async function pluralWords(sb: SupabaseClient, states: number[]): Promise<FormsCandidate[]> {
  const rows: Row[] = [];
  // PostgREST caps a read at 1000 rows
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("card_srs")
      .select("id, state, stability, card:cards!inner(id, translit_nikud, arabic_script, hebrew_meaning, plural_form, item_type)")
      .eq("direction", "he_to_ar")
      .in("state", states)
      .gte("reps", 2)
      .eq("card.item_type", "word")
      .not("card.plural_form", "is", null)
      .order("id")
      .range(from, from + 999)
      .returns<Row[]>();
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows
    .filter((r) => hasOwnPlural(r.card.translit_nikud, r.card.plural_form))
    .map((r) => ({
      card_srs_id: r.id,
      state: r.state,
      stability: r.stability,
      card_id: r.card.id,
      translit_nikud: r.card.translit_nikud,
      arabic_script: r.card.arabic_script,
      hebrew_meaning: r.card.hebrew_meaning,
      plural_form: r.card.plural_form!,
    }));
}

export type FormsAnswer = { card_id: string; correct: boolean; created_at: string };

/** Every answer given in the round, oldest first. */
export async function formsAnswers(sb: SupabaseClient): Promise<FormsAnswer[]> {
  const out: FormsAnswer[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("learning_events")
      .select("card_id, meta, created_at")
      .eq("event", "forms_answer")
      .order("created_at")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data ?? [])
      if (r.card_id) out.push({ card_id: r.card_id, correct: r.meta?.correct === true, created_at: r.created_at });
    if (!data || data.length < 1000) break;
  }
  return out;
}
