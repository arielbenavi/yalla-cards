import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { parseLessonText, parseLessonImages, parseWhatsAppMessages } from "@/lib/gemini";
import { attachDuplicates } from "@/lib/dedup";
import { emptyBatchRow, type RawInput, type BatchRow } from "@/lib/batches";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = supabaseAdmin();

  const { data: batch, error } = await supabase.from("import_batches").select("*").eq("id", id).single();
  if (error || !batch) return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });

  const rawInput = batch.raw_input as RawInput;

  if (rawInput.source === "paste") {
    const parsed = await parseLessonText(rawInput.text);
    const withDuplicates = await attachDuplicates(parsed);
    const rows: BatchRow[] = withDuplicates.map((r) => ({ ...emptyBatchRow(), ...r }));
    return NextResponse.json({ rows });
  }

  if (rawInput.source === "photo") {
    const images = await Promise.all(
      rawInput.image_paths.map(async (path) => {
        const { data: file, error: dlError } = await supabase.storage.from("imports").download(path);
        if (dlError || !file) throw new Error(dlError?.message ?? "download failed");
        const buffer = Buffer.from(await file.arrayBuffer());
        return { mimeType: file.type || "image/jpeg", base64: buffer.toString("base64") };
      })
    );
    const parsed = await parseLessonImages(images);
    const withDuplicates = await attachDuplicates(parsed);
    const rows: BatchRow[] = withDuplicates.map((r) => ({ ...emptyBatchRow(), ...r }));
    return NextResponse.json({ rows });
  }

  if (rawInput.source === "whatsapp") {
    const parsed = await parseWhatsAppMessages(rawInput.messages);
    const withDuplicates = await attachDuplicates(parsed);
    const rows: BatchRow[] = withDuplicates.map((r) => {
      const { source_index, ...rest } = r;
      void source_index;
      return { ...emptyBatchRow(), ...rest };
    });
    return NextResponse.json({ rows });
  }

  // PDF batches are re-parsed client-side, one page at a time via
  // /api/inbox/pdf-extract-page (each page is its own Gemini vision call --
  // looping them all in a single request here risks a function timeout for
  // multi-page ranges), so this route only ever handles the other sources.
  return NextResponse.json({ error: "pdf batches are re-parsed client-side, not via this route" }, { status: 400 });
}
