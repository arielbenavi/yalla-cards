/**
 * Applies chatifai-validated nikud corrections.
 * Fixes confirmed 2026-07-22:
 *   שַזַ'ר → סַגַ'ר  (Palestinian: samech+gimel, not shin+zayin)
 *   פֻרְצַה → פֻרְצֵה (feminine ending tsere, not patach)
 *   אֶלְאִיד... → אִלְאִיד... (ה"א הידיעה: hirik not segol; tsere on kuf)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const fixes: Array<{ from: string; to: string; field?: "translit_nikud" | "hebrew_meaning"; note: string }> = [
  {
    from: "שַזַ׳ר",
    to: "סַגַ'ר",
    note: "chatifai: Palestinian = samech+gimel (سجر), not shin+zayin",
  },
  {
    from: "פֻרְצַה",
    to: "פֻרְצֵה",
    note: "chatifai: feminine -ה in Palestinian = tsere, not patach",
  },
  {
    from: "אֶלְאִיד מַא בִּתְזַקֶּף לַחַאלְהַא",
    to: "אִלְאִיד מַא בִּתְזַקֵּף לַחַאלְהַא",
    note: "chatifai: ה\"א הידיעה = hirik (אִל not אֶל); tsere on kuf (זַקֵּף)",
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
    data.forEach(r => console.log(`  card: ${r.id} (${r.hebrew_meaning})`));
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
