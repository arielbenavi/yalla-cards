// Merges word cards that share a transliteration AND a Hebrew meaning.
//
// These came from importing the "מפגש N - ספר" sets over words that already
// existed as "שיעור N", so the pairs are one reviewed card and one untouched
// copy. Merging keeps the review history and, separately, keeps whichever card
// actually has audio — the survivor is chosen by review history, but a
// recording range on the losing card is copied onto it before the delete.
//
// Safety: refuses to delete any card that has review_log rows, and skips any
// group where both sides have been reviewed (that needs a human).
//
//   npx tsx scripts/merge-duplicate-cards.ts          # dry run
//   npx tsx scripts/merge-duplicate-cards.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").trim();

type Card = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  plural_form: string | null;
  notes: string | null;
  lesson_id: string | null;
  recording_id: string | null;
  audio_start_sec: number | null;
  audio_end_sec: number | null;
  clip_path: string | null;
  created_at: string;
};

const COLS =
  "id, hebrew_meaning, translit_nikud, arabic_script, plural_form, notes, lesson_id, " +
  "recording_id, audio_start_sec, audio_end_sec, clip_path, created_at";

// A card "has audio" only if it can actually be played or re-cut from the
// source — a recording_id with no range is not a clip.
const hasAudio = (c: Card) =>
  !!c.clip_path || (!!c.recording_id && c.audio_start_sec != null && c.audio_end_sec != null);

async function main() {
  const cards: Card[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select(COLS)
      .eq("item_type", "word")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    cards.push(...(data as unknown as Card[]));
    if (data.length < 1000) break;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const title = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  const { data: srs } = await sb.from("card_srs").select("id, card_id");
  const srsByCard = new Map<string, string[]>();
  for (const s of srs ?? []) {
    if (!srsByCard.has(s.card_id)) srsByCard.set(s.card_id, []);
    srsByCard.get(s.card_id)!.push(s.id);
  }
  // review_log exceeds PostgREST's 1000-row default cap; page it or the review
  // counts come back too low and the wrong card gets kept.
  const logCount = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data: logs } = await sb.from("review_log").select("card_srs_id").range(from, from + 999);
    if (!logs?.length) break;
    for (const l of logs) logCount.set(l.card_srs_id, (logCount.get(l.card_srs_id) ?? 0) + 1);
    if (logs.length < 1000) break;
  }
  const reviews = (cardId: string) =>
    (srsByCard.get(cardId) ?? []).reduce((n, id) => n + (logCount.get(id) ?? 0), 0);

  const groups = new Map<string, Card[]>();
  for (const c of cards) {
    const k = `${strip(c.translit_nikud)}|${strip(c.hebrew_meaning)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c);
  }

  const merges: { keep: Card; drop: Card[]; carried: string[] }[] = [];
  const skipped: string[] = [];

  for (const [, v] of groups) {
    if (v.length < 2) continue;

    const reviewed = v.filter((c) => reviews(c.id) > 0);
    if (reviewed.length > 1) {
      skipped.push(
        `${v[0].translit_nikud} — ${reviewed.length} כרטיסים עם היסטוריית חזרות, צריך שיפוט ידני`
      );
      continue;
    }

    // Survivor: most reviews, then audio, then oldest.
    const ranked = v.slice().sort((a, b) => {
      const r = reviews(b.id) - reviews(a.id);
      if (r) return r;
      const au = Number(hasAudio(b)) - Number(hasAudio(a));
      if (au) return au;
      return a.created_at.localeCompare(b.created_at);
    });
    const [keep, ...drop] = ranked;

    // Anything the survivor is missing and a loser has, comes across.
    const carried: string[] = [];
    const patch: Record<string, unknown> = {};
    if (!hasAudio(keep)) {
      const donor = drop.find(hasAudio);
      if (donor) {
        patch.recording_id = donor.recording_id;
        patch.audio_start_sec = donor.audio_start_sec;
        patch.audio_end_sec = donor.audio_end_sec;
        patch.clip_path = donor.clip_path;
        carried.push(`audio←${donor.id.slice(0, 8)}`);
      }
    }
    // The two sides differ only in nikud on the Hebrew, so take the pointed
    // one — שַעַבּ's copy reads "עַם", which is what keeps it distinct from
    // מַע ("עם", with).
    const nikud = (s: string) => (s.normalize("NFC").match(/[֑-ׇ]/g) ?? []).length;
    const richer = drop.find((d) => nikud(d.hebrew_meaning) > nikud(keep.hebrew_meaning));
    if (richer) {
      patch.hebrew_meaning = richer.hebrew_meaning;
      carried.push(`ניקוד←${richer.id.slice(0, 8)}`);
    }

    for (const f of ["arabic_script", "plural_form", "notes"] as const) {
      if (keep[f]) continue;
      const donor = drop.find((d) => d[f]);
      if (donor) {
        patch[f] = donor[f];
        carried.push(`${f}←${donor.id.slice(0, 8)}`);
      }
    }

    merges.push({ keep, drop, carried });
    (keep as any).__patch = patch;
  }

  const fmt = (c: Card) =>
    `${c.id.slice(0, 8)} ${String(c.translit_nikud).padEnd(16)} ` +
    `חזרות:${String(reviews(c.id)).padStart(3)} ` +
    `${hasAudio(c) ? "🔊" : "  "} ${String(title.get(c.lesson_id ?? "") ?? "—").padEnd(22)} ` +
    `${c.hebrew_meaning}`;

  console.log(`${merges.length} קבוצות למיזוג\n`);
  for (const m of merges) {
    console.log(`  שומר  ${fmt(m.keep)}`);
    for (const d of m.drop) console.log(`  מוחק  ${fmt(d)}`);
    if (m.carried.length) console.log(`        מעביר: ${m.carried.join(", ")}`);
    console.log("");
  }
  if (skipped.length) {
    console.log(`\nדילגתי על ${skipped.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  for (const m of merges) {
    const patch = (m.keep as any).__patch as Record<string, unknown>;
    if (Object.keys(patch).length) {
      const { error } = await sb.from("cards").update(patch).eq("id", m.keep.id);
      if (error) throw error;
    }
    for (const d of m.drop) {
      const ids = srsByCard.get(d.id) ?? [];
      if (ids.length) {
        const { count } = await sb
          .from("review_log")
          .select("id", { count: "exact", head: true })
          .in("card_srs_id", ids);
        if ((count ?? 0) > 0) throw new Error(`${d.id} has ${count} review_log rows — aborting`);
        await sb.from("card_srs").delete().eq("card_id", d.id);
      }
      const { error } = await sb.from("cards").delete().eq("id", d.id);
      if (error) throw error;
    }
  }
  console.log(`\n✅ מוזגו ${merges.length} קבוצות`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
