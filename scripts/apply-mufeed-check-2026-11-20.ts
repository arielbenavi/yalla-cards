// Second MuFeed pass (2026-11-20), from MuFeed's full dictionary (scripts/mufeed/dump.py → local_lookup.py → cmp.py).
// Marks exact matches mufeed_verified; fixes cards that only lacked a dagesh MuFeed has; adds MuFeed's present
// tense to verb notes and missing plurals. Old values are backed up first. FSRS untouched.
import { config } from "dotenv"; import { readFileSync, writeFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const D = JSON.parse(readFileSync("scripts/data/mufeed-check-2026-11-20.json", "utf8"));
(async () => {
  const ids = [...D.fixes.map((f: any) => f.id), ...D.present.map((p: any) => p.id)];
  const { data: before } = await sb.from("cards").select("id,translit_nikud,notes,plural_form").in("id", ids);
  writeFileSync("scripts/data/mufeed-check-2026-11-20-backup.json", JSON.stringify(before, null, 1));
  const notes = new Map((before ?? []).map((c) => [c.id, c.notes as string | null]));
  for (let i = 0; i < D.verify.length; i += 200) { const { error } = await sb.from("cards").update({ mufeed_verified: true }).in("id", D.verify.slice(i, i + 200)); if (error) throw error; }
  for (const f of D.fixes) { const { error } = await sb.from("cards").update({ translit_nikud: f.new, mufeed_verified: true }).eq("id", f.id); if (error) throw error; }
  for (const p of D.present) {
    const old = notes.get(p.id) ?? "";
    if (old.includes(p.p)) continue;
    const { error } = await sb.from("cards").update({ notes: (old ? old + "\n" : "") + `הווה: ${p.p} (מופיד)` }).eq("id", p.id); if (error) throw error;
  }
  for (const p of D.plurals) { const { error } = await sb.from("cards").update({ plural_form: p.plural }).eq("id", p.id).is("plural_form", null); if (error) throw error; }
  console.log("✅ verified", D.verify.length + D.fixes.length, "· fixed", D.fixes.length, "· present", D.present.length, "· plurals", D.plurals.length);
})();
