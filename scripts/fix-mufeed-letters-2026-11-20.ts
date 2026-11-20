// Six letter mistakes found by the MuFeed pass (docs/mufeed-review-2026-11-20.md), approved by Ariel,
// and the face card rewritten as MuFeed has it. Backup first; FSRS untouched.
import { config } from "dotenv"; import { writeFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const FIX: [string, Record<string, string>][] = [
  ["קַארַאז׳", { translit_nikud: "כַּרַאג'" }],
  ["מַטְבַּח", { translit_nikud: "מַטְבַּח'" }],
  ["חַ'מְסְטַעְש", { translit_nikud: "חַ'מְסְתַעְש" }],
  ["אַריבּ", { translit_nikud: "אַרִיבּ" }],
  ["אַזְרַכּ", { translit_nikud: "אַזְרַק" }],
  ["אָמִין", { translit_nikud: "אַמִין" }],
  ["וֻוז'", { translit_nikud: "וִשּ / וִגֵ'ה", arabic_script: "وش / وجه", plural_form: "וֻג'וּה" }],
];
(async () => {
  const { data } = await sb.from("cards").select("id,translit_nikud,arabic_script,plural_form,hebrew_meaning").in("translit_nikud", FIX.map((f) => f[0]));
  writeFileSync("scripts/data/mufeed-letters-2026-11-20-backup.json", JSON.stringify(data, null, 1));
  for (const [old, upd] of FIX) {
    const rows = (data ?? []).filter((c) => c.translit_nikud === old);
    if (rows.length !== 1) { console.log(`⚠ ${old}: ${rows.length} cards`); continue; }
    const { error } = await sb.from("cards").update(upd).eq("id", rows[0].id); if (error) throw error;
    console.log(`${old} → ${upd.translit_nikud}  (${rows[0].hebrew_meaning})`);
  }
})();
