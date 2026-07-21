/**
 * Applies chatifai-validated nikud corrections (batch 2, 2026-07-22).
 * Fixes confirmed:
 *   סַגַ'רַה → סַגַ'רֵה  (feminine tsere ending; ס confirmed over ש)
 *   דוֹלֶה → דוֹלֵה      (feminine tsere ending, not segol)
 * Run: npx tsx scripts/fix-cards-chatifai2.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const fixes = [
  {
    from: "סַגַ'רַה",
    to: "סַגַ'רֵה",
    note: "chatifai: feminine ending = tsere (סַגַ'רֵה not סַגַ'רַה)",
  },
  {
    from: "דוֹלֶה",
    to: "דוֹלֵה",
    note: "chatifai: feminine -ה ending = tsere, not segol",
  },
];

async function main() {
  for (const fix of fixes) {
    const { data, error } = await s
      .from("cards")
      .update({ translit_nikud: fix.to })
      .eq("translit_nikud", fix.from)
      .select("id, hebrew_meaning");
    if (error) { console.error("ERR:", fix.from, error.message); continue; }
    if (!data?.length) { console.log("NOT FOUND:", fix.from); continue; }
    console.log(`✓ FIXED (${fix.note})`);
    console.log(`  "${fix.from}" → "${fix.to}"`);
    data.forEach((r) => console.log(`  card: ${r.id} (${r.hebrew_meaning})`));
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
