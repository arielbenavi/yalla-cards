import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { transcribeChunk } from "@/lib/groq";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const chunk = formData.get("chunk") as File;
  const offsetSec = Number(formData.get("offset_sec") ?? 0);

  if (!chunk) return NextResponse.json({ error: "no chunk" }, { status: 400 });

  const bytes = new Uint8Array(await chunk.arrayBuffer());
  const words = await transcribeChunk(bytes, chunk.name || "chunk.opus");

  const offsetWords = words.map((w) => ({
    word: w.word,
    start: w.start + offsetSec,
    end: w.end + offsetSec,
  }));

  return NextResponse.json({ words: offsetWords });
}
