import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  nextContrast,
  buildPair,
  checkMinimalPair,
  FEATURE_LABEL,
  type ContrastMastery,
  type Feature,
  type PossessiveForm,
} from "@/lib/possessives";

/** Stage-1 identification trials for the possessive drill (note 04cff308).
 *
 *  Reads only. Attempts go to possessive_attempts via POST /api/possessives/attempt.
 */

/** Predicates carrying no gender or number cue of their own — that is the whole
 *  point. כְּבִּיר agrees with the noun, not the possessor, so it cannot leak
 *  which person the suffix encodes. */
const PREDICATES = [
  { translit: "כְּבִּיר", he_m: "גדול", he_f: "גדולה" },
  { translit: "זְעִ'יר", he_m: "קטן", he_f: "קטנה" },
  { translit: "גְ'דִיד", he_m: "חדש", he_f: "חדשה" },
  { translit: "בְּעִיד", he_m: "רחוק", he_f: "רחוקה" },
];

/** The Hebrew gloss has to agree with the Hebrew noun — "מכונית שלו חדש" reads
 *  as broken Hebrew even though the Arabic is correct. The Arabic adjective is
 *  the same either way, so this changes only the prompt. */
const FEMININE_HE = new Set(["מכונית", "דירה", "שכונה", "עיר"]);

export async function GET(request: Request) {
  const size = Math.min(20, Number(new URL(request.url).searchParams.get("size") ?? 10));
  const supabase = supabaseAdmin();

  const [{ data: forms }, { data: attempts }] = await Promise.all([
    // Unverified forms are never served — a wrong vowel in a minimal pair
    // teaches the wrong thing and there is no context to rescue it
    supabase.from("possessive_forms").select("*").eq("chatifai_verified", true),
    supabase
      .from("possessive_attempts")
      .select("target_feature, contrast_with, correct")
      .eq("stage", 1),
  ]);

  if (!forms?.length) {
    return NextResponse.json({
      items: [],
      contrast: null,
      reason: "אין עדיין צורות מאומתות — הזרעה ממתינה לאימות chatifai",
    });
  }

  const mastery = new Map<string, ContrastMastery>();
  for (const a of attempts ?? []) {
    if (!a.contrast_with) continue;
    const key = [a.target_feature, a.contrast_with].sort().join(">");
    const m = mastery.get(key) ?? { trials: 0, correct: 0 };
    m.trials++;
    if (a.correct) m.correct++;
    mastery.set(key, m);
  }
  // nextContrast keys on the ordered pair, so mirror the sorted keys onto it
  const ordered = new Map<string, ContrastMastery>();
  for (const [a, b] of [
    ["his", "her"],
    ["your_m", "your_f"],
    ["my", "our"],
    ["your_pl", "their"],
  ] as [Feature, Feature][]) {
    const m = mastery.get([a, b].sort().join(">"));
    if (m) ordered.set(`${a}>${b}`, m);
  }

  const [featA, featB] = nextContrast(ordered);

  const byBase = new Map<string, Map<Feature, PossessiveForm>>();
  for (const f of forms as PossessiveForm[]) {
    if (!byBase.has(f.base_translit)) byBase.set(f.base_translit, new Map());
    byBase.get(f.base_translit)!.set(f.feature, f);
  }

  const items = [];
  const bases = [...byBase.entries()].filter(([, m]) => m.has(featA) && m.has(featB));

  for (let i = 0; i < size && bases.length; i++) {
    const [, formsForBase] = bases[Math.floor(Math.random() * bases.length)];
    const a = formsForBase.get(featA)!;
    const b = formsForBase.get(featB)!;
    const p = PREDICATES[Math.floor(Math.random() * PREDICATES.length)];
    const predicate = {
      translit: p.translit,
      he: FEMININE_HE.has(a.base_he) ? p.he_f : p.he_m,
    };

    const pair = buildPair(a, b, predicate);
    if (!pair) continue;

    // Refuse to serve a trial that leaks its own answer, rather than trusting
    // that the generator got it right
    const check = checkMinimalPair(pair.a, pair.b, a.form_translit, b.form_translit);
    if (!check.ok) continue;

    // Ask for one of the two at random so the answer is not always option A
    const askA = Math.random() < 0.5;
    const target = askA ? a : b;

    items.push({
      base_translit: a.base_translit,
      base_he: a.base_he,
      target_feature: target.feature,
      contrast_with: (askA ? b : a).feature,
      prompt_he: askA ? pair.heA : pair.heB,
      options: [
        { feature: a.feature, sentence: pair.a, arabic: a.form_arabic },
        { feature: b.feature, sentence: pair.b, arabic: b.form_arabic },
      ].sort(() => Math.random() - 0.5),
    });
  }

  return NextResponse.json({
    items,
    contrast: {
      a: featA,
      b: featB,
      label: `${FEATURE_LABEL[featA]} / ${FEATURE_LABEL[featB]}`,
    },
  });
}
