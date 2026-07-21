/**
 * chatifai batch 3 corrections (2026-07-22).
 * גַ'מַאעַה → גַ'מַאעֵה  (feminine tsere)
 * מַחְדַאדֶה → מַחְדַדֵה  (no alef; tsere)
 * עַטַאר → עַטַּאר      (dagesh on tet confirmed)
 * בַּרְבִּיז׳ → בַּרְבִּישׁ  (Palestinian: shin not zhir)
 * צַחַּה → צִחַּה        (chirik on tsadi in Palestinian)
 * Run: npx tsx scripts/fix-cards-chatifai3.ts
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
  { from: "גַ'מַאעַה",   to: "גַ'מַאעֵה",  note: "feminine tsere ending" },
  { from: "מַחְדַאדֶה",  to: "מַחְדַדֵה",  note: "no alef; tsere ending" },
  { from: "עַטַאר",      to: "עַטַּאר",     note: "dagesh on tet" },
  { from: "בַּרְבִּיז׳", to: "בַּרְבִּישׁ", note: "Palestinian: shin not zhir" },
  { from: "צַחַּה",      to: "צִחַּה",      note: "chirik on tsadi in Palestinian" },
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
    console.log(`✓ ${fix.from} → ${fix.to}  (${fix.note})`);
    data.forEach((r) => console.log(`  card ${r.id}: ${r.hebrew_meaning}`));
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
