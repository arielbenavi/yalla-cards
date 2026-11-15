// Applies scripts/data/mufeed-apply-2026-11-15.json: marks cards that match MuFeed's dictionary
// exactly as mufeed_verified, and fixes 8 transliterations (old values kept in the json).
import { config } from "dotenv"; config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js"; import { readFileSync } from "fs";
const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const a = JSON.parse(readFileSync("scripts/data/mufeed-apply-2026-11-15.json", "utf8"));
(async () => {
  for (let i = 0; i < a.verify.length; i += 100) {
    const { error } = await s.from("cards").update({ mufeed_verified: true }).in("id", a.verify.slice(i, i + 100));
    if (error) throw error;
  }
  for (const f of a.fix) {
    const { error } = await s.from("cards").update({ translit_nikud: f.new, mufeed_verified: true }).eq("id", f.id).eq("translit_nikud", f.old);
    if (error) throw error;
  }
  console.log("verified", a.verify.length, "fixed", a.fix.length);
})();
