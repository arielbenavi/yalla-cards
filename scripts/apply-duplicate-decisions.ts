// Applies the hand-made merge decisions in scripts/data/duplicate-decisions.ts.
//
// Same safety rules as the automatic merge: never delete a card with review_log
// rows, and carry the losing card's audio, Arabic and notes onto the survivor
// if the survivor is missing them.
//
//   npx tsx scripts/apply-duplicate-decisions.ts          # dry run
//   npx tsx scripts/apply-duplicate-decisions.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { DECISIONS } from "./data/duplicate-decisions";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

type Card = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  plural_form: string | null;
  notes: string | null;
  recording_id: string | null;
  audio_start_sec: number | null;
  audio_end_sec: number | null;
  clip_path: string | null;
};

const COLS =
  "id, hebrew_meaning, translit_nikud, arabic_script, plural_form, notes, " +
  "recording_id, audio_start_sec, audio_end_sec, clip_path";

const hasAudio = (c: Card) =>
  !!c.clip_path || (!!c.recording_id && c.audio_start_sec != null && c.audio_end_sec != null);

// LIKE against a uuid column errors in PostgREST ("operator does not exist:
// uuid ~~ unknown"), so the whole table comes back and matching happens here.
let ALL: Card[] = [];
async function loadCards() {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select(COLS).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    ALL.push(...(data as unknown as Card[]));
    if (data.length < 1000) break;
  }
}

function byPrefix(prefix: string): Card {
  const rows = ALL.filter((c) => c.id.startsWith(prefix));
  if (rows.length !== 1) throw new Error(`${prefix}: expected 1 card, got ${rows.length}`);
  return rows[0];
}

async function reviewCount(cardId: string) {
  const { data: srs } = await sb.from("card_srs").select("id").eq("card_id", cardId);
  const ids = (srs ?? []).map((s) => s.id);
  if (!ids.length) return { ids, count: 0 };
  const { count } = await sb
    .from("review_log")
    .select("id", { count: "exact", head: true })
    .in("card_srs_id", ids);
  return { ids, count: count ?? 0 };
}

async function main() {
  const plan: { keep: Card; drop: Card; patch: Record<string, unknown>; srsIds: string[] }[] = [];

  await loadCards();

  for (const d of DECISIONS) {
    const keep = byPrefix(d.keep);
    const drop = byPrefix(d.drop);

    const { count } = await reviewCount(drop.id);
    if (count > 0) throw new Error(`${d.drop} (${drop.translit_nikud}) has ${count} reviews`);
    const { ids: srsIds } = await reviewCount(drop.id);

    const patch: Record<string, unknown> = {};
    if (keep.hebrew_meaning !== d.meaning) patch.hebrew_meaning = d.meaning;
    if (!hasAudio(keep) && hasAudio(drop)) {
      patch.recording_id = drop.recording_id;
      patch.audio_start_sec = drop.audio_start_sec;
      patch.audio_end_sec = drop.audio_end_sec;
      patch.clip_path = drop.clip_path;
    }
    for (const f of ["arabic_script", "plural_form", "notes"] as const) {
      if (!keep[f] && drop[f]) patch[f] = drop[f];
    }

    plan.push({ keep, drop, patch, srsIds });
    console.log(
      `  ${keep.translit_nikud.padEnd(16)} שומר ${keep.id.slice(0, 8)} · מוחק ${drop.id.slice(0, 8)}` +
        `  →  ${d.meaning}${hasAudio(keep) ? " 🔊" : patch.clip_path ? " 🔊(הועבר)" : ""}`
    );
  }

  if (!APPLY) {
    console.log(`\n${plan.length} מיזוגים — dry run, pass --apply to write`);
    return;
  }

  for (const p of plan) {
    if (Object.keys(p.patch).length) {
      const { error } = await sb.from("cards").update(p.patch).eq("id", p.keep.id);
      if (error) throw error;
    }
    if (p.srsIds.length) await sb.from("card_srs").delete().eq("card_id", p.drop.id);
    const { error } = await sb.from("cards").delete().eq("id", p.drop.id);
    if (error) throw error;
  }
  console.log(`\n✅ מוזגו ${plan.length}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
