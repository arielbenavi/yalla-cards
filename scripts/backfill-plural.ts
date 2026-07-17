/**
 * One-off: extract "רבים: X" from notes → plural_form column.
 * Safe to re-run (skips cards that already have plural_form set).
 * Usage: npx tsx --env-file=.env.local scripts/backfill-plural.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

// Extracts plural_form and returns cleaned notes.
// Matches "רבים: <value>" where value runs to end of string.
function extractPlural(notes: string): { plural_form: string; cleaned_notes: string } | null {
  const match = notes.match(/^(.*?)רבים:\s*(.+)$/);
  if (!match) return null;
  const before = match[1].replace(/[.\s]+$/, "").trim();
  const plural = match[2].trim();
  return { plural_form: plural, cleaned_notes: before };
}

async function main() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, translit_nikud, notes, plural_form")
    .ilike("notes", "%רבים:%")
    .is("plural_form", null);

  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Cards to process: ${cards?.length ?? 0}`);

  let updated = 0, skipped = 0, errors = 0;

  for (const card of cards ?? []) {
    if (!card.notes) { skipped++; continue; }
    const extracted = extractPlural(card.notes);
    if (!extracted) { skipped++; continue; }

    const { error: updateErr } = await supabase
      .from("cards")
      .update({
        plural_form: extracted.plural_form,
        notes: extracted.cleaned_notes || null,
      })
      .eq("id", card.id);

    if (updateErr) {
      console.error(`  ERROR ${card.translit_nikud}: ${updateErr.message}`);
      errors++;
    } else {
      console.log(`  OK: ${card.translit_nikud}`);
      console.log(`      plural: ${extracted.plural_form}`);
      if (extracted.cleaned_notes) console.log(`      notes:  ${extracted.cleaned_notes}`);
      updated++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
