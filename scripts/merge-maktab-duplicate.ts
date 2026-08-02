// Merges the two מַכְּתַבּ (office) cards into one.
//
// Explicitly does NOT touch מַכְּתַבֵּה (library) — a different word, and the user
// said to leave it alone.
//
// Neither card has review_log history, so nothing is lost. The surviving card
// keeps the richer Hebrew side and the lesson the word is actually taught in.
//
//   npx tsx scripts/merge-maktab-duplicate.ts          # dry run
//   npx tsx scripts/merge-maktab-duplicate.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const KEEP = "35995fb2"; // שיעור 3, "משרד / ספרייה", 2 card_srs rows
const DROP = "45b2781a"; // שיעור 2, "משרד", 1 card_srs row

async function main() {
  const { data: cards } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, notes, lesson_id")
    .ilike("translit_nikud", "מַכְּתַבּ");

  const keep = (cards ?? []).find((c) => c.id.startsWith(KEEP));
  const drop = (cards ?? []).find((c) => c.id.startsWith(DROP));
  if (!keep || !drop) throw new Error("expected both מַכְּתַבּ cards");

  // Refuse to delete anything that has been reviewed
  const { data: srs } = await sb.from("card_srs").select("id").eq("card_id", drop.id);
  const srsIds = (srs ?? []).map((s) => s.id);
  if (srsIds.length) {
    const { count } = await sb
      .from("review_log")
      .select("id", { count: "exact", head: true })
      .in("card_srs_id", srsIds);
    if ((count ?? 0) > 0) {
      throw new Error(`${DROP} has ${count} review_log rows — refusing to delete`);
    }
  }

  // "משרד / ספרייה" is wrong for مكتب on its own — ספרייה is مكتبة, which is a
  // separate card. The merged card says what the word means.
  const merged = "משרד";

  console.log(`keep  ${keep.id.slice(0, 8)}  ${keep.hebrew_meaning}  →  ${merged}`);
  console.log(`drop  ${drop.id.slice(0, 8)}  ${drop.hebrew_meaning}`);
  console.log(`      ${srsIds.length} card_srs row(s), 0 review_log rows`);

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  await sb.from("cards").update({ hebrew_meaning: merged }).eq("id", keep.id);
  await sb.from("card_srs").delete().eq("card_id", drop.id);
  const { error } = await sb.from("cards").delete().eq("id", drop.id);
  if (error) throw error;
  console.log("\n✅ merged");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
