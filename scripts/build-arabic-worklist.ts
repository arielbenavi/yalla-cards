// The מפגש 8 book pages give Hebrew transliteration and no Arabic at all, so
// 129 of its cards have an empty arabic_script. This builds the worklist for a
// chatifai pass that asks for the ARABIC SCRIPT ONLY.
//
// That pass is the safe kind: the word and its meaning came from the course and
// are fixed, and the Arabic spelling has no lesson provenance to overrule —
// there is nothing for chatifai to substitute.
//
//   npx tsx scripts/build-arabic-worklist.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const { data: lessons } = await sb.from("lessons").select("id, title");
  const titleById = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  // Every card missing Arabic, whatever lesson it sits in — including the ones
  // with no lesson at all. Paging: a plain select() stops at 1000 and would
  // silently under-report.
  const all: {
    id: string;
    translit_nikud: string | null;
    hebrew_meaning: string | null;
    item_type: string | null;
    arabic_script: string | null;
    lesson_id: string | null;
  }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, translit_nikud, hebrew_meaning, item_type, arabic_script, lesson_id")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as typeof all));
    if (data.length < 1000) break;
  }

  const out: { id: string; translit: string; he: string; lesson: string; type: string }[] = [];
  for (const c of all) {
    if (c.arabic_script?.trim()) continue;
    // A card with no transliteration or no gloss is not something chatifai can
    // be asked about — there is nothing to point at.
    if (!c.translit_nikud?.trim() || !c.hebrew_meaning?.trim()) continue;
    out.push({
      id: c.id,
      translit: c.translit_nikud,
      he: c.hebrew_meaning,
      lesson: (c.lesson_id && titleById.get(c.lesson_id)) || "(בלי שיעור)",
      type: c.item_type ?? "word",
    });
  }

  const byLesson: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const o of out) {
    byLesson[o.lesson] = (byLesson[o.lesson] ?? 0) + 1;
    byType[o.type] = (byType[o.type] ?? 0) + 1;
  }
  console.log(`${out.length} כרטיסים בלי כתב ערבי`);
  console.log("  לפי שיעור:", JSON.stringify(byLesson));
  console.log("  לפי סוג:  ", JSON.stringify(byType));

  writeFileSync("scripts/data/arabic-worklist.json", JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log("\nנכתב scripts/data/arabic-worklist.json");
  console.log("\n--- 15 ראשונים ---");
  for (const o of out.slice(0, 15)) console.log(`  [${o.type}] ${o.translit.padEnd(28)} ${o.he}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
