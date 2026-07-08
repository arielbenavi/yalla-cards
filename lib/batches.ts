export type BatchSource = "paste" | "photo" | "whatsapp" | "pdf";

export type DuplicateMatch = { id: string; hebrew_meaning: string; translit_nikud: string; similarity: number };

// A single extracted item, persisted in import_batches.parsed_rows (jsonb).
// committed/card_id track whether this specific row has already been turned
// into a card, so reopening a batch can show what's left to commit.
export type BatchRow = {
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: "word" | "phrase" | "sentence";
  confidence: "low" | "high";
  notes: string;
  arabic_script: string | null;
  item_number: number | null;
  page_number: number | null;
  recording_id: string | null;
  duplicate_of: DuplicateMatch | null;
  committed: boolean;
  card_id: string | null;
};

export function emptyBatchRow(): BatchRow {
  return {
    hebrew_meaning: "",
    translit_nikud: "",
    item_type: "phrase",
    confidence: "high",
    notes: "",
    arabic_script: null,
    item_number: null,
    page_number: null,
    recording_id: null,
    duplicate_of: null,
    committed: false,
    card_id: null,
  };
}

export type RawInput =
  | { source: "paste"; text: string }
  | { source: "photo"; image_paths: string[] }
  | { source: "whatsapp"; chat_identifier: string; messages: { index: number; text: string }[] }
  | { source: "pdf"; page_image_paths: string[]; page_range: { from: number; to: number } };

export type ImportBatch = {
  id: string;
  source: BatchSource;
  lesson_id: string | null;
  raw_input: RawInput;
  parsed_rows: BatchRow[];
  created_at: string;
  updated_at: string;
};

export type BatchSummary = {
  id: string;
  source: BatchSource;
  lesson_id: string | null;
  lesson: { title: string | null; date: string } | null;
  created_at: string;
  updated_at: string;
  total_rows: number;
  committed_rows: number;
};

export type ItemNumberGap = { number: number; nearPages: number[] };

// For numbered vocab lists (PDF import), finds gaps in the 1..max sequence
// and points at the page(s) of the numbered neighbors so it's easy to jump
// back and recheck those pages for a possibly-missed item.
export function findItemNumberGaps(rows: BatchRow[]): ItemNumberGap[] {
  const numbered = rows
    .filter((r): r is BatchRow & { item_number: number } => r.item_number !== null)
    .sort((a, b) => a.item_number - b.item_number);

  if (numbered.length === 0) return [];

  const maxNumber = numbered[numbered.length - 1].item_number;
  const present = new Set(numbered.map((r) => r.item_number));
  const gaps: ItemNumberGap[] = [];

  for (let n = 1; n <= maxNumber; n++) {
    if (present.has(n)) continue;
    const lower = [...numbered].reverse().find((r) => r.item_number < n);
    const upper = numbered.find((r) => r.item_number > n);
    const nearPages = Array.from(
      new Set(
        [lower?.page_number, upper?.page_number].filter((p): p is number => p !== null && p !== undefined)
      )
    );
    gaps.push({ number: n, nearPages });
  }

  return gaps;
}
