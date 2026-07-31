// Dumps every word-type card (id, hebrew, translit, arabic, lesson) as JSON
// so verbs can be picked out for the verb-paradigm work.
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
  const lessonTitle = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, lesson_id, chatifai_verified")
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const out = rows.map((r) => ({ ...r, lesson: lessonTitle.get(r.lesson_id) ?? null }));
  writeFileSync("/tmp/all-cards.json", JSON.stringify(out, null, 2));
  const byType = out.reduce<Record<string, number>>((a, r) => ((a[r.item_type] = (a[r.item_type] ?? 0) + 1), a), {});
  console.log(`${out.length} cards →`, byType);
}

main();
