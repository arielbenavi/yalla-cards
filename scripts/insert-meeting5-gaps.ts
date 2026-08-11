// Fills the two מפגש 5 gaps: the תַבַּע/תַע column and the 20 ש"ב solutions.
//
// The תבע table becomes a drill immediately — the inflection-drill route picks
// up any paradigm whose rows carry `person`, and Ariel asked specifically for
// more pronoun-inflection practice. The ש"ב solutions stay reference.
//
//   npx tsx scripts/insert-meeting5-gaps.ts          # dry run
//   npx tsx scripts/insert-meeting5-gaps.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks } from "./lib/normalize-marks";
import { TABAA_MEETING_5, HOMEWORK_SOLUTIONS } from "./data/meeting5-gaps";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;

function normalizeDeep<T>(value: T): T {
  if (typeof value === "string") return normalizeMarks(value) as unknown as T;
  if (Array.isArray(value)) return value.map(normalizeDeep) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalizeDeep(v)])
    ) as T;
  }
  return value;
}

/** Every transliteration on these pages is Hebrew; an Arabic letter or a
 *  leftover Arabic diacritic means the transcription picked up the wrong
 *  codepoint, which has slipped through twice before. */
function assertHebrewOnly(label: string, s: string): void {
  if (ARABIC_LETTER.test(s)) throw new Error(`${label}: ערבית בשדה התעתיק — ${s}`);
  if (ARABIC_MARK.test(s)) throw new Error(`${label}: סימן ערבי בתעתיק העברי — ${s}`);
}

async function main() {
  const tabaa = normalizeDeep(TABAA_MEETING_5);
  const solutions = normalizeDeep(HOMEWORK_SOLUTIONS);

  for (const r of tabaa.data.rows) {
    assertHebrewOnly(r.person, r.tabaa);
    assertHebrewOnly(r.person, r.taa);
  }
  for (const s of solutions) assertHebrewOnly(`ש"ב ${s.num}`, s.translit);

  const { data: existing, error } = await sb
    .from("paradigms")
    .select("id, slug")
    .eq("meeting", 5);
  if (error) throw error;
  const have = new Set((existing ?? []).map((p) => p.slug));

  const planned = [
    { slug: tabaa.slug, data: tabaa.data },
    {
      slug: "homework_solutions",
      data: {
        title: 'מפגש 5 — ש"ב, פתרון',
        type: "translation_exercise",
        note: "פתרונות שיעורי הבית. אלה לא משפטי התרגול מעמוד 74 שכבר במערכת",
        sentences: solutions,
      },
    },
  ].filter((p) => !have.has(p.slug));

  console.log(`${planned.length} טבלאות להוספה למפגש 5\n`);
  for (const p of planned) console.log(`  [paradigm] ${p.slug}`);
  console.log(`\nתַבַּע/תַע — ${tabaa.data.rows.length} גופים, נכנס מיד לתרגול ההטיות`);
  console.log(`ש"ב — ${solutions.length} משפטים`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const p of planned) {
    const { error: e } = await sb.from("paradigms").insert({ meeting: 5, slug: p.slug, data: p.data });
    if (e) throw e;
  }
  console.log(`\n✅ נוספו ${planned.length} טבלאות`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
