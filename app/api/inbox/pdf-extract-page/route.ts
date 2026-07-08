import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractPdfPage } from "@/lib/gemini";
import { attachDuplicates } from "@/lib/dedup";

// Retries inside extractPdfPage can add up to ~65s of backoff on top of the
// two Gemini calls themselves, so this needs more headroom than the default.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { base64, mimeType } = (await request.json()) as { base64: string; mimeType?: string };
  if (!base64) return NextResponse.json({ error: "no image" }, { status: 400 });

  try {
    const extracted = await extractPdfPage({ mimeType: mimeType || "image/png", base64 });
    const items = await attachDuplicates(extracted);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
