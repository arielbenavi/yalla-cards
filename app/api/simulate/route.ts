import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** The conversation tab is the only feature needing ANTHROPIC_API_KEY, and it
 *  was set locally but never in Vercel — so it worked in development and threw
 *  a raw SDK exception into the chat bubble in production. Checked up front so
 *  the message says what is actually wrong. */
function missingApiKey(): boolean {
  return !process.env.ANTHROPIC_API_KEY?.trim();
}

const SCENARIO_LABELS: Record<string, string> = {
  market: "a market scene where the user is buying and the AI is selling (haggling is expected)",
  taxi: "a taxi ride where the user is the passenger giving directions",
  restaurant: "a restaurant where the user is ordering food",
  street: "a street scene where the user is asking a local for directions",
  cafe: "a cafe where the user is ordering drinks and making small talk",
};

async function fetchVocab(): Promise<string> {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("cards")
      .select("hebrew_meaning, translit_nikud, arabic_script, item_type")
      .in("item_type", ["word", "phrase"])
      .order("created_at", { ascending: true })
      .limit(250);
    if (!data?.length) return "";
    const lines = data.map((c) =>
      `• ${c.translit_nikud}${c.arabic_script ? ` (${c.arabic_script})` : ""} — ${c.hebrew_meaning}`
    );
    return `\n\nמילים וביטויים שהלומד לומד (השתמש בהם בטבעיות כשמתאים):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
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

  if (missingApiKey()) {
    return NextResponse.json(
      {
        error:
          "מסך השיחה דורש ANTHROPIC_API_KEY. הוא מוגדר ב-.env.local אבל לא ב-Vercel — " +
          "צריך להוסיף אותו ב-Settings → Environment Variables ואז לפרוס מחדש.",
      },
      { status: 503 }
    );
  }

  const scenarioDesc = SCENARIO_LABELS[scenario] ?? "a general conversation";
  const vocab = await fetchVocab();

  const systemPrompt = `You are a Palestinian Arabic conversation partner for Israeli Hebrew speakers learning the language.
The user writes in Hebrew. You respond ONLY in Palestinian Arabic dialect (Jerusalem/Jaffa colloquial — not Modern Standard Arabic).

Format every response like this:
[Arabic response in Hebrew transliteration with nikkud]
(תרגום עברי של התשובה שלך)

Rules:
- Use spoken Palestinian Arabic, not MSA. Use dialect words like "وين" (ויין), "شو" (שו), "هلق" (הלאק), etc.
- Write the Arabic using Hebrew letters with nikkud so the learner can pronounce it.
- Immediately after the Arabic line, put the Hebrew translation in parentheses on the next line.
- Keep responses short: 1–3 sentences.
- Be warm, encouraging, and natural — like a friendly local.
- If the user makes an Arabic mistake, gently correct it by modeling the right form in your response.
- Scenario: ${scenarioDesc}.${vocab}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
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
        const raw = err instanceof Error ? err.message : "Stream error";
        // Don't leak SDK internals into the chat bubble — the auth message in
        // particular reads as gibberish to someone practising Arabic
        const msg = /authentication|api[_ -]?key|apiKey/i.test(raw)
          ? "מסך השיחה לא מוגדר — חסר ANTHROPIC_API_KEY בסביבת הפרודקשן."
          : raw;
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
