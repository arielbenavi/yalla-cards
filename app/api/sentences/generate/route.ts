import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type GeneratedSentence = {
  translit: string;  // Hebrew-script nikud transliteration
  he: string;        // Hebrew meaning/translation
};

export async function GET() {
  // Auth check
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE)?.value;
  if (!isValidAuthCookie(authCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data: cards, error } = await supabase
    .from("cards")
    .select("hebrew_meaning, translit_nikud, arabic_script, item_type")
    .not("translit_nikud", "is", null)
    .order("created_at", { ascending: false })
    .limit(600);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vocab = (cards ?? []).filter((c) => c.translit_nikud?.trim());

  // Use first 8 cards as few-shot nikud style examples
  const nikudExamples = vocab
    .slice(0, 8)
    .map((c) => `  - ${c.translit_nikud} (${c.hebrew_meaning})`)
    .join("\n");

  // Build vocab list for Claude
  const vocabLines = vocab
    .map((c) => `${c.translit_nikud} = ${c.hebrew_meaning}`)
    .join("\n");

  const systemPrompt = `אתה עוזר ללומדי ערבית פלסטינית (ניב ירושלמי/יפואי).

דוגמאות לסגנון הניקוד הקיים:
${nikudExamples}

כללי ניקוד חשובים (שמור עליהם בדיוק):
- ע' מסומן כ-ע — לדוגמה: עַ, עִ, עֶ
- ח' וgh מסומנים כ-ח — לדוגמה: חָ, חִ
- q (قاف) מסומן כ-ק
- שָׁ עם דגש
- שְׁוָוא מסומן
- פתחות מסומנות בדיוק

צור 12 משפטים קצרים בערבית פלסטינית מדוברת תוך שימוש אך ורק במילים שמופיעות ברשימת האוצר מילים למטה.
המשפטים צריכים להיות ממשפטי יומיום פשוטים ומגוונים — לא כולם אותו מבנה.
כל משפט: 4–8 מילים.

ענה ONLY ב-JSON הבא (ללא טקסט נוסף):
{
  "sentences": [
    { "translit": "...", "he": "..." },
    ...
  ]
}

"translit" = תעתיק עברי עם ניקוד מלא בסגנון הדוגמאות למעלה.
"he" = תרגום עברי קצר וטבעי.`;

  const userPrompt = `רשימת אוצר המילים:
${vocabLines}

צור 12 משפטים פשוטים ויומיומיים תוך שימוש ברק מהמילים ברשימה.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON even if Claude wraps it in markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response from Claude", raw }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { sentences: GeneratedSentence[] };
    return NextResponse.json({ sentences: parsed.sentences ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    const friendlyMsg = msg.includes("credit balance")
      ? "אין קרדיט בחשבון Anthropic — יש להוסיף קרדיט ב-console.anthropic.com"
      : msg;
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
