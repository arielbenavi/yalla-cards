import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseLessonImages } from "@/lib/gemini";
import { attachDuplicates } from "@/lib/dedup";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("images") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "no images" }, { status: 400 });
  }

  const images = await Promise.all(
    files.map(async (file) => ({
      mimeType: file.type,
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
    }))
  );

  const parsed = await parseLessonImages(images);
  const rows = await attachDuplicates(parsed);
  return NextResponse.json({ rows });
}
