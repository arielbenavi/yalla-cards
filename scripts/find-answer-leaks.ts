// Finds cards whose Hebrew side gives away the Arabic answer.
//
// Note 0c2ddbd9: "ביחד (סוא)" — the parenthetical is the transliteration, so
// in the he→ar direction the card answers itself. Same defect wherever a
// bracketed hint echoes translit_nikud.
//
//   npx tsx scripts/find-answer-leaks.ts          # dry run
//   npx tsx scripts/find-answer-leaks.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

// Compare consonant skeletons: the Hebrew hint is unpointed, the translit is
// pointed, and ' marks emphatics that the hint drops.
const skeleton = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ'"׳״\s]/g, "").trim();

type Card = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: string;
  notes: string | null;
};

async function main() {
  const cards: Card[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, hebrew_meaning, translit_nikud, item_type, notes")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    cards.push(...(data as Card[]));
    if (data.length < 1000) break;
  }

  const hits: { card: Card; cleaned: string; notes: string }[] = [];
  for (const c of cards) {
    if (!c.hebrew_meaning?.includes("(")) continue;
    const target = skeleton(c.translit_nikud ?? "");
    if (!target) continue;

    // Drop only the parentheticals that echo the transliteration; genuine
    // disambiguators like "מורה (נ)" must survive.
    const removed: string[] = [];
    const cleaned = c.hebrew_meaning
      .replace(/\s*\(([^)]*)\)/g, (m, inner: string) => {
        const s = skeleton(inner);
        if (!s) return m;
        if (!(target.includes(s) || s.includes(target))) return m;
        removed.push(inner.trim());
        return "";
      })
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!cleaned || cleaned === c.hebrew_meaning) continue;

    // The parenthetical often carries real teaching content ("גם תחילית עתיד"),
    // so it moves to notes rather than being thrown away — it just stops
    // appearing on the side of the card being asked.
    const notes = [c.notes?.trim(), ...removed].filter(Boolean).join(" · ");
    hits.push({ card: c, cleaned, notes });
  }

  for (const h of hits) {
    console.log(
      `  ${h.card.id.slice(0, 8)} ${String(h.card.translit_nikud).padEnd(18)} ` +
        `${h.card.hebrew_meaning}  →  ${h.cleaned}\n` +
        `           הערות: ${h.notes}`
    );
  }
  console.log(`\n${hits.length} כרטיסים שמסגירים את התשובה`);

  if (!APPLY) {
    console.log("dry run — pass --apply to write");
    return;
  }
  for (const h of hits) {
    const { error } = await sb
      .from("cards")
      .update({ hebrew_meaning: h.cleaned, notes: h.notes })
      .eq("id", h.card.id);
    if (error) throw error;
  }
  console.log(`✅ תוקנו ${hits.length}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
