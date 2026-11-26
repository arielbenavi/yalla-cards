import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { FORMS_ROUND_SIZE, formsAnswers, formsGroup, pluralWords, type FormsWord } from "@/lib/forms-round";

/** state 2 = Review: a word still being learned gets no plural yet. */
const STATE_REVIEW = 2;

// The words of one forms round (docs/forms-round.md): group A only, never asked
// first, then the ones asked longest ago, ties at random. Read only.
export async function GET() {
  const sb = supabaseAdmin();
  try {
    const [words, answers] = await Promise.all([pluralWords(sb, [STATE_REVIEW]), formsAnswers(sb)]);
    // answers come oldest first, so the last write is the latest ask
    const lastAsked = new Map(answers.map((a) => [a.card_id, Date.parse(a.created_at)]));
    const picked: FormsWord[] = words
      .filter((w) => formsGroup(w.card_id) === "A")
      .map((w) => ({ w, at: lastAsked.get(w.card_id) ?? 0, tie: Math.random() }))
      .sort((a, b) => a.at - b.at || a.tie - b.tie)
      .slice(0, FORMS_ROUND_SIZE)
      .map(({ w }) => ({
        card_id: w.card_id,
        translit_nikud: w.translit_nikud,
        arabic_script: w.arabic_script,
        hebrew_meaning: w.hebrew_meaning,
        plural_form: w.plural_form,
      }));
    return NextResponse.json({ words: picked });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
