import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  buildMastery,
  solidContrasts,
  FEATURE_LABEL,
  type Feature,
  type PossessiveForm,
} from "@/lib/possessives";

/** Stage 3 of the possessive drill — typed production (note 04cff308).
 *
 *  Gated: a contrast appears here only once it is solid in stage 1. That
 *  ordering is the method, not a nicety, so it is enforced here in the queue
 *  rather than only being hidden in the UI — otherwise any client could ask for
 *  production of a contrast the learner cannot yet recognise.
 */

const PREDICATES = [
  { translit: "כְּבִּיר", he_m: "גדול", he_f: "גדולה" },
  { translit: "זְעִ'יר", he_m: "קטן", he_f: "קטנה" },
  { translit: "גְ'דִיד", he_m: "חדש", he_f: "חדשה" },
  { translit: "בְּעִיד", he_m: "רחוק", he_f: "רחוקה" },
];

const FEMININE_HE = new Set(["מכונית", "דירה", "שכונה", "עיר"]);

export async function GET(request: Request) {
  const size = Math.min(20, Number(new URL(request.url).searchParams.get("size") ?? 8));
  const supabase = supabaseAdmin();

  const [{ data: forms }, { data: attempts }] = await Promise.all([
    supabase.from("possessive_forms").select("*").eq("chatifai_verified", true),
    supabase
      .from("possessive_attempts")
      .select("target_feature, contrast_with, correct")
      .eq("stage", 1),
  ]);

  const mastery = buildMastery(attempts ?? []);
  const unlocked = solidContrasts(mastery);

  if (!unlocked.length) {
    return NextResponse.json({
      items: [],
      reason:
        "שלב ההפקה נפתח אחרי שהזיהוי יציב. תרגל את שלב הזיהוי — " +
        "אי אפשר להתבקש לייצר ניגוד שעוד לא מזהים.",
    });
  }

  const unlockedFeatures = new Set<Feature>(unlocked.flat());

  const byBase = new Map<string, PossessiveForm[]>();
  for (const f of (forms ?? []) as PossessiveForm[]) {
    if (!unlockedFeatures.has(f.feature)) continue;
    if (!byBase.has(f.base_translit)) byBase.set(f.base_translit, []);
    byBase.get(f.base_translit)!.push(f);
  }

  const pool = [...byBase.values()].flat();
  const items = [];

  for (let i = 0; i < size && pool.length; i++) {
    const f = pool[Math.floor(Math.random() * pool.length)];
    const p = PREDICATES[Math.floor(Math.random() * PREDICATES.length)];
    const he = FEMININE_HE.has(f.base_he) ? p.he_f : p.he_m;

    items.push({
      base_translit: f.base_translit,
      base_he: f.base_he,
      target_feature: f.feature,
      feature_label: FEATURE_LABEL[f.feature],
      // The gap sentence: everything except the form the learner must produce.
      prompt_he: `${f.form_he} ${he}`,
      tail_translit: p.translit,
      expected_translit: f.form_translit,
      expected_arabic: f.form_arabic,
    });
  }

  return NextResponse.json({
    items,
    unlocked: unlocked.map(([a, b]) => `${FEATURE_LABEL[a]} / ${FEATURE_LABEL[b]}`),
  });
}
