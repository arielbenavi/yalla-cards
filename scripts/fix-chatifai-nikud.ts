/**
 * Applies chatifai-validated nikud corrections to cards.
 * Run: npx tsx scripts/fix-chatifai-nikud.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const fixes: Array<{ from: string; to: string; note: string }> = [
  {
    from: "חַ'לִּיכּ חַדִּי",
    to: "חַ'לִיכּ חַ'אדִי",
    note: "chatifai: ח' על חאדי, ו-לִיכּ בלי דגש בלמד",
  },
  {
    from: "שׁוּ אִלְוַצ'ע?",
    to: "שוּ אִל-וַצֵ'ע?",
    note: "chatifai: צֵירֵי לפני ע'",
  },
];

async function main() {
  for (const fix of fixes) {
    const { data, error } = await s
      .from("cards")
      .update({ translit_nikud: fix.to })
      .eq("translit_nikud", fix.from)
      .select("id");
    if (error) { console.error("ERR:", fix.from, error.message); continue; }
    console.log(`FIXED (${fix.note}): "${fix.from}" → "${fix.to}" (${data?.length} rows)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
