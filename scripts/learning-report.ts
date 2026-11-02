/**
 * Is what came from the Speak review doing anything? Read only.
 * Usage: npx tsx scripts/learning-report.ts
 *
 * Fix round: of the cards rated שוב, how did the next real review go, with a fix
 * round in between and without one. Example line: same for words shown one.
 * Small samples; read it after a few weeks, and it isn't an experiment (cards aren't
 * assigned at random), so treat a difference as a hint.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function fetchAll<T>(table: string, columns: string, filter?: (q: any) => any): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(columns);
    if (filter) q = filter(q);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function main() {
  type Log = { card_srs_id: string; rating: number; reviewed_at: string };
  const logs = await fetchAll<Log>("review_log", "card_srs_id,rating,reviewed_at");
  const fix = await fetchAll<{ card_srs_id: string; practiced_at: string; outcome: number }>(
    "focused_practice_log", "card_srs_id,practiced_at,outcome", (q) => q.eq("source", "fix_round")
  );
  const events = await fetchAll<{ event: string }>("learning_events", "event");
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.event] = (counts[e.event] ?? 0) + 1;
  console.log("events", counts, "fix-round attempts", fix.length);

  const byCard = new Map<string, Log[]>();
  for (const l of logs) byCard.set(l.card_srs_id, [...(byCard.get(l.card_srs_id) ?? []), l]);
  const since = fix.length ? Math.min(...fix.map((f) => +new Date(f.practiced_at))) - 14 * 86_400_000 : Infinity;
  const tally = { with: { n: 0, again: 0 }, without: { n: 0, again: 0 } };
  for (const [id, list] of byCard) {
    list.sort((a, b) => +new Date(a.reviewed_at) - +new Date(b.reviewed_at));
    list.forEach((l, i) => {
      const next = list[i + 1];
      const at = +new Date(l.reviewed_at);
      const nextAt = next ? +new Date(next.reviewed_at) : 0;
      // Next review on a later day: a same-day relearning step would say nothing.
      if (l.rating !== 1 || !next || at < since || nextAt - at < 12 * 3600_000) return;
      const fixed = fix.some((f) => f.card_srs_id === id && +new Date(f.practiced_at) > at && +new Date(f.practiced_at) < nextAt);
      const bucket = fixed ? tally.with : tally.without;
      bucket.n++;
      if (next.rating === 1) bucket.again++;
    });
  }
  const pct = (b: { n: number; again: number }) => (b.n ? `${Math.round((100 * b.again) / b.n)}% שוב (${b.n})` : "—");
  console.log(`after שוב, next day's review — with fix round: ${pct(tally.with)}, without: ${pct(tally.without)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
