/**
 * The forms round report (docs/forms-round.md). Read only.
 *
 *   npx tsx scripts/forms-report.ts
 *
 * How to read it:
 *   - A has clearly fewer Agains than B: the extra minute also strengthens the
 *     base word. Keep the round, and consider adding feminine once there is a
 *     source.
 *   - No difference, but plural accuracy rises: it teaches plurals without
 *     hurting anything. Keep it if Ariel likes it.
 *   - Neither: remove the button and keep the report.
 *
 * Caveat: group A also gets extra exposure to the singular, so a win shows the
 * round is worth its minutes, not that plurals as such are the cause. That is
 * the question Ariel asked.
 *
 * The compared words include Relearning ones (state 3), not only the Review
 * ones the round picks from: a word just rated Again sits in state 3, and
 * leaving it out would drop exactly the failures being counted.
 *
 * The z-test treats reviews as independent although a word can have several,
 * so read a borderline p with caution.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { FORMS_ROUND_START, formsAnswers, formsGroup, pluralWords, type FormsCandidate } from "../lib/forms-round";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as never },
});

const MIN_REVIEWS = 200;
const RATING_AGAIN = 1;
// New York midnight, where he reviews: an Israel midnight would count reviews
// made on the evening before the round shipped
const start = new Date(`${FORMS_ROUND_START}T00:00:00-05:00`);
const pct = (k: number, n: number) => (n ? `${((100 * k) / n).toFixed(1)}%` : "-");

/** Two-sided p for a z score (Abramowitz–Stegun normal tail). */
function pValue(z: number): number {
  const x = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * x);
  const poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return Math.min(1, 2 * 0.3989422804 * Math.exp((-x * x) / 2) * poly);
}

async function reviewsOf(words: FormsCandidate[]) {
  const ids = new Set(words.map((w) => w.card_srs_id));
  let n = 0;
  let again = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("review_log")
      .select("card_srs_id, rating")
      .gte("reviewed_at", start.toISOString())
      .order("reviewed_at")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data ?? [])
      if (ids.has(r.card_srs_id)) {
        n++;
        if (r.rating === RATING_AGAIN) again++;
      }
    if (!data || data.length < 1000) break;
  }
  return { n, again };
}

async function main() {
  const [words, answers, eligible] = await Promise.all([pluralWords(sb, [2, 3]), formsAnswers(sb), pluralWords(sb, [2])]);

  console.log(`סבב צורות, since ${FORMS_ROUND_START}\n`);
  console.log("1. Did the round help the word itself? (he_to_ar reviews)");
  const groups = {} as Record<"A" | "B", { n: number; again: number }>;
  for (const g of ["A", "B"] as const) {
    const mine = words.filter((w) => formsGroup(w.card_id) === g);
    const r = await reviewsOf(mine);
    groups[g] = r;
    const stability = mine.reduce((s, w) => s + w.stability, 0) / (mine.length || 1);
    console.log(`  ${g}: ${mine.length} words, ${r.n} reviews, Again ${pct(r.again, r.n)}, mean stability now ${stability.toFixed(1)} days`);
  }
  const { A, B } = groups;
  const pooled = (A.again + B.again) / (A.n + B.n || 1);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / (A.n || 1) + 1 / (B.n || 1)));
  if (A.n && B.n && se > 0) {
    const z = (A.again / A.n - B.again / B.n) / se;
    console.log(`  two-proportion z-test on Again (A − B): z = ${z.toFixed(2)}, p = ${pValue(z).toFixed(3)}`);
  } else console.log("  z-test: nothing to compare yet");
  if (A.n < MIN_REVIEWS || B.n < MIN_REVIEWS)
    console.log(`  Fewer than about ${MIN_REVIEWS} reviews per group: not enough data yet, run it 3 more weeks.`);

  console.log("\n2. Is he learning the plurals? (forms_answer)");
  const asks = answers.filter((a) => new Date(a.created_at) >= start);
  if (!asks.length) console.log("  no answers yet");
  const weeks = new Map<number, [number, number]>();
  const seen = new Set<string>();
  const first: [number, number] = [0, 0];
  const later: [number, number] = [0, 0];
  for (const a of asks) {
    const week = Math.floor((Date.parse(a.created_at) - start.getTime()) / (7 * 86_400_000)) + 1;
    const w = weeks.get(week) ?? [0, 0];
    weeks.set(week, w);
    for (const bucket of [w, seen.has(a.card_id) ? later : first]) {
      bucket[0] += a.correct ? 1 : 0;
      bucket[1] += 1;
    }
    seen.add(a.card_id);
  }
  for (const [week, [k, n]] of weeks) console.log(`  week ${week}: ${pct(k, n)} (${k}/${n})`);
  if (asks.length) {
    console.log(`  first ask of a word: ${pct(...first)} (${first[0]}/${first[1]})`);
    console.log(`  second ask and later: ${pct(...later)} (${later[0]}/${later[1]})`);
  }

  console.log("\n3. Coverage");
  const eligibleA = eligible.filter((w) => formsGroup(w.card_id) === "A");
  const asked = eligibleA.filter((w) => seen.has(w.card_id)).length;
  console.log(`  A words asked at least once: ${asked} of ${eligibleA.length} eligible now`);
  console.log(`  eligible now: ${eligible.length} (A ${eligibleA.length}, B ${eligible.length - eligibleA.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
