import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseWhatsAppMessages } from "@/lib/gemini";
import { attachDuplicates } from "@/lib/dedup";

export async function POST(request: NextRequest) {
  const { messages } = (await request.json()) as { messages: { index: number; text: string }[] };

  if (!messages?.length) {
    return NextResponse.json({ error: "no messages" }, { status: 400 });
  }

  const parsed = await parseWhatsAppMessages(messages);
  const rows = await attachDuplicates(parsed);
  return NextResponse.json({ rows });
}
