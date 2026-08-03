// Finds Arabic diacritics that leaked into Hebrew transliteration, and Hebrew
// nikud that leaked into Arabic.
//
// Arabic shadda (U+0651) and Hebrew dagesh (U+05BC) render identically inside a
// pointed Hebrew word, so a wrong one is invisible on screen and breaks every
// exact-match comparison silently. I typed U+0651 into two dialogue fixes
// before noticing. The same class of bug put an Arabic dal inside לחד earlier.
//
//   npx tsx scripts/scan-script-mixing.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const HEBREW_LETTER = /[א-ת]/;
const ARABIC_LETTER = /[ء-ي]/;
const ARABIC_MARK = /[ً-ْٰ]/;
const HEBREW_MARK = /[֑-ׇ]/;

/** Arabic marks sitting in text whose letters are Hebrew, or vice versa. */
function mixed(s: string): string | null {
  if (!s) return null;
  const hasHeb = HEBREW_LETTER.test(s);
  const hasAr = ARABIC_LETTER.test(s);
  if (hasHeb && !hasAr && ARABIC_MARK.test(s)) return "סימן ערבי בטקסט עברי";
  if (hasAr && !hasHeb && HEBREW_MARK.test(s)) return "ניקוד עברי בטקסט ערבי";
  if (hasHeb && hasAr) return "שני הכתבים באותו שדה";
  return null;
}

async function main() {
  let found = 0;
  const report = (where: string, field: string, val: string, why: string) => {
    found++;
    console.log(`  ${where} · ${field}: ${why}`);
    console.log(`      ${val.slice(0, 70)}`);
  };

  // cards
  for (let from = 0; ; from += 1000) {
    const { data } = await sb
      .from("cards")
      .select("id, translit_nikud, hebrew_meaning, arabic_script")
      .range(from, from + 999);
    if (!data?.length) break;
    for (const c of data) {
      for (const f of ["translit_nikud", "hebrew_meaning", "arabic_script"] as const) {
        const why = mixed((c as Record<string, string>)[f] ?? "");
        if (why) report(`card ${c.id.slice(0, 8)}`, f, (c as Record<string, string>)[f], why);
      }
    }
    if (data.length < 1000) break;
  }

  // dialogues
  const { data: rows } = await sb.from("paradigms").select("slug, data").like("slug", "simulation_%");
  for (const r of rows ?? []) {
    const d = r.data as { turns?: Record<string, unknown>[] };
    (d.turns ?? []).forEach((t, i) => {
      const cells = [t, ...(((t.options as Record<string, unknown>[]) ?? []))];
      for (const c of cells) {
        for (const f of ["translit", "he"] as const) {
          const why = mixed((c[f] as string) ?? "");
          if (why) report(`${r.slug} תור ${i + 1}`, f, c[f] as string, why);
        }
      }
    });
  }

  console.log(found ? `\n${found} מקרים של ערבוב כתבים` : "\n✅ אין ערבוב כתבים");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
