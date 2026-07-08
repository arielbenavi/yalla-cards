import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractPdfPage } from "@/lib/gemini";
import { attachDuplicates } from "@/lib/dedup";

export async function POST(request: NextRequest) {
  const { base64, mimeType } = (await request.json()) as { base64: string; mimeType?: string };
  if (!base64) return NextResponse.json({ error: "no image" }, { status: 400 });

  const extracted = await extractPdfPage({ mimeType: mimeType || "image/png", base64 });
  const items = await attachDuplicates(extracted);
  return NextResponse.json({ items });
}
