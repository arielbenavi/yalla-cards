import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";
import { cookies } from "next/headers";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCENARIO_LABELS: Record<string, string> = {
  market: "a market scene where the user is buying and the AI is selling (haggling is expected)",
  taxi: "a taxi ride where the user is the passenger giving directions",
  restaurant: "a restaurant where the user is ordering food",
  street: "a street scene where the user is asking a local for directions",
  cafe: "a cafe where the user is ordering drinks and making small talk",
};

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE)?.value;
  if (!isValidAuthCookie(authCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, scenario } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    scenario: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const scenarioDesc = SCENARIO_LABELS[scenario] ?? "a general conversation";

  const systemPrompt = `You are a Palestinian Arabic conversation partner for Israeli Hebrew speakers learning the language.
The user writes in Hebrew. You respond ONLY in Palestinian Arabic dialect (Jerusalem/Jaffa colloquial — not Modern Standard Arabic).

Format every response like this:
[Arabic response in Hebrew transliteration with nikkud]
(תרגום עברי של התשובה שלך)

Rules:
- Use spoken Palestinian Arabic, not MSA. Use dialect words like "وين" (ויין), "شو" (שו), "هلق" (هלאק), etc.
- Write the Arabic using Hebrew letters with nikkud so the learner can pronounce it.
- Immediately after the Arabic line, put the Hebrew translation in parentheses on the next line.
- Keep responses short: 1–3 sentences.
- Be warm, encouraging, and natural — like a friendly local.
- If the user makes an Arabic mistake, gently correct it by modeling the right form in your response.
- Scenario: ${scenarioDesc}.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 256,
          system: systemPrompt,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`\n[שגיאה: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}
