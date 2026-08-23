// Note 4fa5f38d: "בסיומות שייכות יש קצת מדי, אבל אם דאגת שיהיה רק דברים שהיו
// באמת בקורס אז צריך להיזהר עם להוסיף עוד."
//
// The question is provenance, not volume: is every base in possessive_forms a
// word that actually appeared in the course? A base with no card behind it is a
// word the drill invented, and drilling a suffix on a word Ariel never met
// teaches the suffix on unfamiliar ground.
//
//   npx tsx scripts/audit-possessive-provenance.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

/** Base letters only — Ariel's spelling is unpointed, the cards are pointed,
 *  and final forms differ. Comparing anything less has produced wrong counts. */
const fold = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ً-ٰ]/g, "")
   .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ")
   .replace(/[()'"׳״]/g, "").replace(/\s+/g, " ").trim();

async function allCards() {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud, arabic_script, hebrew_meaning").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  const { data: forms, error } = await sb.from("possessive_forms").select("*");
  if (error) throw error;
  const cards = await allCards();

  // A card matches if the base word appears in it — as the whole card or inside
  // a sentence. Whole-card matching alone undercounts: سيارة is all over the
  // course but only ever inside phrases ("מַפַאתִיח (אל)סַיַארַה"), so an
  // equality test reports it as invented when it is not.
  const foldedCards = cards.map((c) => fold(c.translit_nikud ?? ""));
  const arabicCards = cards.map((c) => (c.arabic_script ?? "").trim());
  const inCourse = (baseTranslit: string, baseArabic: string) => {
    const t = fold(baseTranslit);
    if (t && foldedCards.some((c) => c.includes(t))) return true;
    const a = (baseArabic ?? "").trim();
    return Boolean(a) && arabicCards.some((c) => c.includes(a));
  };

  const bases = new Map<string, any[]>();
  for (const f of forms!) {
    if (!bases.has(f.base_translit)) bases.set(f.base_translit, []);
    bases.get(f.base_translit)!.push(f);
  }

  console.log(`${forms!.length} forms over ${bases.size} bases\n`);
  const orphans: string[] = [];
  for (const [base, rows] of bases) {
    const inCards = inCourse(base, rows[0].base_arabic);
    const verified = rows.filter((r) => r.chatifai_verified).length;
    const flag = inCards ? "✓ בקורס" : "✗ אין כרטיס";
    if (!inCards) orphans.push(base);
    console.log(
      `${flag.padEnd(12)} ${base.padEnd(12)} ${(rows[0].base_he ?? "").padEnd(10)} ` +
        `${rows.length} צורות · chatifai ${verified}/${rows.length} · ${rows[0].pattern_class}`
    );
  }

  console.log(`\nבסיסים בלי כרטיס בקורס: ${orphans.length}${orphans.length ? " — " + orphans.join(", ") : ""}`);
  const unverified = forms!.filter((f) => !f.chatifai_verified);
  console.log(`צורות לא מאומתות ב-chatifai: ${unverified.length}`);
  for (const u of unverified) console.log(`   ${u.base_translit} / ${u.feature} → ${u.form_translit}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
