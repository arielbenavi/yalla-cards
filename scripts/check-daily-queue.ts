// Checks that lib/daily-queue.ts (the iPhone app's offline queue) builds the
// same daily queue as /api/review/queue. Read only.
//
//   npx tsx scripts/check-daily-queue.ts [base-url]   (default http://localhost:3000)
import { dailyQueue, type DeckCard, type ReviewEvent } from "../lib/daily-queue";

const base = process.argv[2] ?? "http://localhost:3000";

async function main() {
  const [deck, server] = await Promise.all([
    fetch(`${base}/api/mobile/deck`).then((r) => r.json()) as Promise<{ cards: DeckCard[]; reviews: ReviewEvent[]; audio: Record<string, string> }>,
    fetch(`${base}/api/review/queue`).then((r) => r.json()) as Promise<{ cards: { card_srs_id: string }[] }>,
  ]);
  const local = dailyQueue(deck.cards, deck.reviews).map((c) => c.card_srs_id);
  const remote = server.cards.map((c) => c.card_srs_id);
  console.log(`deck ${deck.cards.length} cards, ${deck.reviews.length} recent reviews, ${Object.keys(deck.audio).length} clips`);
  console.log(`queue: server ${remote.length}, phone ${local.length}`);
  const same = local.length === remote.length && local.every((id, i) => id === remote[i]);
  if (!same) {
    const i = local.findIndex((id, k) => id !== remote[k]);
    console.log(`first difference at ${i}: server ${remote[i]} / phone ${local[i]}`);
    process.exit(1);
  }
  console.log("✅ identical, in the same order");
}
main().catch((e) => { console.error(e); process.exit(1); });
