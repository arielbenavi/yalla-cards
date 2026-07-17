/**
 * One-off CSV importer for mafgash vocabulary CSVs.
 * Usage: npx tsx scripts/import-csv.ts <path-to-csv> [lesson-title]
 *   e.g. npx tsx scripts/import-csv.ts yalla_cards_import.csv "שיעור 1"
 *
 * Idempotent: rows whose nikkud-stripped translit already exists are skipped.
 * item_number (when present) is prepended to notes as "פריט N. ".
 * ** markdown emphasis markers are stripped from every field.
 *
 * CSV columns: item_number, translit_nikud, hebrew_meaning, arabic_script,
 *              item_type, notes
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// --- helpers ---

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

// Extracts "רבים: X" from notes into a separate field.
// Returns { plural_form, notes } — plural_form is null if not found.
function extractPlural(notes: string): { plural_form: string | null; notes: string } {
  const match = notes.match(/^(.*?)רבים:\s*(.+)$/);
  if (!match) return { plural_form: null, notes };
  const before = match[1].replace(/[.\s]+$/, "").trim();
  return { plural_form: match[2].trim(), notes: before };
}

// Strips Hebrew nikkud (U+05B0–U+05BD, U+05BF, U+05C1, U+05C2, U+05C4–U+05C5, U+05C7)
// for dedup comparison only — we keep nikkud in the actual stored value.
function stripNikkud(s: string): string {
  return s.replace(/[ְ-ׇֽֿׁׂׅׄ]/g, "").trim();
}

// Minimal CSV parser that handles quoted fields (including escaped "" inside quotes).
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // quoted field
      i++; // skip opening quote
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ",") i++; // skip comma
    } else {
      // unquoted field
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }
  return fields;
}

async function main() {
  const csvPath = process.argv[2];
  const lessonTitle = process.argv[3] ?? "שיעור 1";

  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-csv.ts <csv-file> [lesson-title]");
    process.exit(1);
  }

  // Disable realtime to avoid WebSocket requirement in Node scripts
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, realtime: { transport: class {} as any } }
  );

  // --- 1. Resolve lesson id ---
  const { data: existingLesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("title", lessonTitle)
    .maybeSingle();

  let lessonId: string;
  if (existingLesson) {
    lessonId = existingLesson.id;
    console.log(`Lesson "${lessonTitle}" found: ${lessonId}`);
  } else {
    const today = new Date().toISOString().slice(0, 10);
    const { data: newLesson, error } = await supabase
      .from("lessons")
      .insert({ title: lessonTitle, date: today })
      .select("id")
      .single();
    if (error || !newLesson) {
      console.error("Failed to create lesson:", error);
      process.exit(1);
    }
    lessonId = newLesson.id;
    console.log(`Lesson "${lessonTitle}" created: ${lessonId}`);
  }

  // --- 2. Load existing cards for dedup (nikkud-stripped translit) ---
  const { data: existingCards } = await supabase
    .from("cards")
    .select("translit_nikud");

  const existingNormalized = new Set(
    (existingCards ?? []).map((c) => stripNikkud(c.translit_nikud))
  );
  console.log(`Existing cards for dedup: ${existingNormalized.size}`);

  // --- 3. Parse CSV ---
  const lines = fs
    .readFileSync(path.resolve(csvPath), "utf-8")
    .split("\n")
    .filter((l) => l.trim());

  // skip header
  const header = parseCsvLine(lines[0]);
  const colIndex = (name: string) => header.indexOf(name);
  const iItemNumber = colIndex("item_number");
  const iTranslit = colIndex("translit_nikud");
  const iMeaning = colIndex("hebrew_meaning");
  const iArabic = colIndex("arabic_script");
  const iType = colIndex("item_type");
  const iNotes = colIndex("notes");

  type CsvRow = {
    item_number: number | null;
    translit_nikud: string;
    hebrew_meaning: string;
    arabic_script: string | null;
    item_type: "word" | "phrase" | "sentence";
    notes: string;
    plural_form: string | null;
  };

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    const rawItemNum = fields[iItemNumber]?.trim() ?? "";
    const itemNumber = rawItemNum ? parseInt(rawItemNum, 10) : null;
    const translit = stripMarkdown(fields[iTranslit] ?? "");
    const meaning = stripMarkdown(fields[iMeaning] ?? "");
    const arabic = stripMarkdown(fields[iArabic] ?? "") || null;
    const itemType = (fields[iType]?.trim() as CsvRow["item_type"]) || "word";
    let rawNotes = stripMarkdown(fields[iNotes] ?? "");

    if (!translit) continue;

    // Prefix notes with item number if present
    if (itemNumber !== null) {
      rawNotes = `פריט ${itemNumber}. ${rawNotes}`.trimEnd();
    }

    // Extract plural_form from notes if present ("רבים: X")
    const { plural_form, notes } = extractPlural(rawNotes);

    rows.push({ item_number: itemNumber, translit_nikud: translit, hebrew_meaning: meaning, arabic_script: arabic, item_type: itemType, notes, plural_form });
  }

  console.log(`CSV rows parsed: ${rows.length}`);

  // --- 4. Insert, skipping duplicates ---
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const normalized = stripNikkud(row.translit_nikud);
    if (existingNormalized.has(normalized)) {
      console.log(`  SKIP (exists): ${row.translit_nikud}`);
      skipped++;
      continue;
    }

    const { data: card, error: cardErr } = await supabase
      .from("cards")
      .insert({
        lesson_id: lessonId,
        translit_nikud: row.translit_nikud,
        hebrew_meaning: row.hebrew_meaning,
        arabic_script: row.arabic_script,
        item_type: row.item_type,
        notes: row.notes || null,
        plural_form: row.plural_form || null,
      })
      .select("id")
      .single();

    if (cardErr || !card) {
      const msg = `ERROR inserting "${row.translit_nikud}": ${cardErr?.message}`;
      console.error("  " + msg);
      errors.push(msg);
      continue;
    }

    const { error: srsErr } = await supabase
      .from("card_srs")
      .insert({ card_id: card.id, direction: "he_to_ar" });

    if (srsErr) {
      const msg = `ERROR creating card_srs for card ${card.id}: ${srsErr.message}`;
      console.error("  " + msg);
      errors.push(msg);
      continue;
    }

    // Track in the local set so subsequent identical rows in this CSV are also skipped
    existingNormalized.add(normalized);
    inserted++;
    console.log(`  INSERT: ${row.translit_nikud} — ${row.hebrew_meaning}`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors.length}`);
  if (errors.length) errors.forEach((e) => console.error("  " + e));
}

main().catch((e) => { console.error(e); process.exit(1); });
