import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { words } = await request.json();

  const supabase = supabaseAdmin();

  const { error } = await supabase
    .from("recordings")
    .update({ transcript_json: { words } })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-generate a Hebrew title if this recording doesn't have one yet
  const { data: rec } = await supabase.from("recordings").select("title").eq("id", id).single();

  if (!rec?.title && Array.isArray(words) && words.length > 0) {
    try {
      const sample = (words as { word: string }[])
        .slice(0, 80)
        .map((w) => w.word)
        .join(" ");

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 60,
        messages: [
          {
            role: "user",
            content: `זאת הקלטה של שיעור ערבית פלסטינית. הנה תמלול (בתעתיק עברי) של תחילת ההקלטה:\n"${sample}"\n\nכתוב כותרת קצרה בעברית (3–6 מילים) שמתארת על מה ההקלטה. רק הכותרת, ללא הסברים.`,
          },
        ],
      });

      const title = response.content[0].type === "text" ? response.content[0].text.trim() : null;
      if (title) {
        await supabase.from("recordings").update({ title }).eq("id", id);
      }
    } catch {
      // Non-fatal — title stays null, user can set manually
    }
  }

  return NextResponse.json({ ok: true });
}
