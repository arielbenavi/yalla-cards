// Fills plural_form from MuFeed (scripts/data/mufeed-plurals-2026-11-20.json, made by scripts/mufeed/plurals.py)
// only where the card has none. Exact Arabic match, nouns and adjectives. FSRS untouched.
import { config } from "dotenv"; import { readFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const rows: { id: string; plural: string }[] = JSON.parse(readFileSync("scripts/data/mufeed-plurals-2026-11-20.json", "utf8"));
(async () => { let n = 0;
  for (const r of rows) { const { data, error } = await sb.from("cards").update({ plural_form: r.plural }).eq("id", r.id).is("plural_form", null).select("id"); if (error) throw error; n += data!.length; }
  console.log("✅ plurals", n); })();
