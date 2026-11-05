// Removes card notes that only repeat in Latin what the nikud already says (Ariel, 2026-11-05).
// Notes about a spoken form that differs from the pointing stay. Old values go to
// scripts/data/removed-pronunciation-notes.json. Never touches card_srs.
//   npx tsx scripts/remove-pronunciation-notes.ts          # dry run
//   npx tsx scripts/remove-pronunciation-notes.ts --apply
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");

const DROP = [
  /^הגייה: /, // הגייה: nset
  /^יזיד: [A-Za-z' ]+( \([a-z]+\))?$/, // יזיד: Bahis
  /^במחברת: (kul elihtiran|תמריל \/ tamril|תאור|נז׳ם מה בעד|בתרוח עלה|בתרוח עליכ)$/, // only how it was typed
];
const REWRITE: [RegExp, string][] = [[/^אריאל: bisamoo — /, ""]];

(async () => {
  const rows: { id: string; translit_nikud: string; notes: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("id,translit_nikud,notes").not("notes", "is", null).range(f, f + 999);
    if (error) throw error;
    rows.push(...(data as typeof rows));
    if (data!.length < 1000) break;
  }
  const changes = rows.flatMap((c) => {
    const parts = c.notes.split(" · ").filter((p) => !DROP.some((re) => re.test(p.trim()))).map((p) => REWRITE.reduce((t, [re, to]) => t.replace(re, to), p));
    const notes = parts.join(" · ").trim() || null;
    return notes === c.notes ? [] : [{ ...c, next: notes }];
  });
  changes.forEach((c) => console.log(c.translit_nikud.slice(0, 26), "|", c.notes.slice(0, 50), "→", c.next ?? "(ריק)"));
  console.log(`${changes.length} cards`);
  if (!APPLY) { process.exit(0); }
  writeFileSync("scripts/data/removed-pronunciation-notes.json", JSON.stringify(changes.map(({ id, translit_nikud, notes }) => ({ id, translit_nikud, notes })), null, 1));
  for (const c of changes) {
    const { error } = await sb.from("cards").update({ notes: c.next }).eq("id", c.id);
    if (error) throw error;
  }
  console.log("✅ updated");
  process.exit(0);
})();
