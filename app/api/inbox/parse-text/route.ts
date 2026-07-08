import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseLessonText } from "@/lib/gemini";
import { attachDuplicates } from "@/lib/dedup";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "empty text" }, { status: 400 });
  }

  const parsed = await parseLessonText(text);
  const rows = await attachDuplicates(parsed);
  return NextResponse.json({ rows });
}
