import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { PossessiveForm } from "@/lib/possessives";

/** Stage 2 of the possessive drill — assembly (note 04cff308).
 *
 *  Explicitly **not graded**. This route never touches possessive_attempts, so
 *  nothing that happens here can move the stage-1 mastery numbers or the stage-3
 *  gate. It only answers "which pattern classes has he not been shown yet", and
 *  records that he has now seen one.
 */

/** What actually happens to the base, in the learner's own terms. */
const PATTERN_NOTE: Record<string, string> = {
  regular: "הבסיס לא משתנה — הסיומת פשוט נדבקת",
  feminine_ta: "ה-ة הופכת ל-ת לפני הסיומת",
  vowel_base: "הבסיס מסתיים בתנועה, ולכן הסיומת נשמעת אחרת",
};

export async function GET() {
  const supabase = supabaseAdmin();

  const [{ data: forms }, { data: seen }] = await Promise.all([
    supabase.from("possessive_forms").select("*").eq("chatifai_verified", true),
    supabase.from("possessive_patterns_seen").select("pattern_class"),
  ]);

  const seenSet = new Set((seen ?? []).map((s) => s.pattern_class));

  // One worked example per pattern class: the base, the suffix that was added,
  // and the result. Showing the join is the whole content of this stage.
  const byPattern = new Map<string, PossessiveForm[]>();
  for (const f of (forms ?? []) as PossessiveForm[]) {
    if (!byPattern.has(f.pattern_class)) byPattern.set(f.pattern_class, []);
    byPattern.get(f.pattern_class)!.push(f);
  }

  const patterns = [...byPattern.entries()]
    .filter(([cls]) => !seenSet.has(cls))
    .map(([cls, list]) => {
      // "his" is the clearest join to display; fall back to whatever exists.
      const example = list.find((f) => f.feature === "his") ?? list[0];
      return {
        pattern_class: cls,
        note: PATTERN_NOTE[cls] ?? "",
        base_translit: example.base_translit,
        base_he: example.base_he,
        base_arabic: (example as PossessiveForm & { base_arabic?: string }).base_arabic ?? "",
        form_translit: example.form_translit,
        form_arabic: example.form_arabic,
        form_he: example.form_he,
        feature: example.feature,
      };
    });

  return NextResponse.json({ patterns });
}

export async function POST(request: Request) {
  const { pattern_class } = await request.json();
  if (!pattern_class) {
    return NextResponse.json({ error: "pattern_class חסר" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("possessive_patterns_seen")
    .upsert({ pattern_class }, { onConflict: "pattern_class" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
