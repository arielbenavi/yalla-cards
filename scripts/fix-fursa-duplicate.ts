import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  // Delete newer duplicate (less info: "הזדמנות / חופשה")
  const { error: delErr } = await sb
    .from("cards")
    .delete()
    .eq("id", "aa4e702d-2936-4883-b377-68e99ac8cff6");
  if (delErr) { console.error("delete error:", delErr.message); process.exit(1); }
  console.log("✅ נמחקה כרטיסית הכפולה aa4e702d");

  // Fix nikud on older card: פֻרְצֵה → פֻרְצַה
  const { error: upErr } = await sb
    .from("cards")
    .update({ translit_nikud: "פֻרְצַה" })
    .eq("id", "b82b6cb1-fa27-48cb-8ea4-91275faf56f5");
  if (upErr) { console.error("update error:", upErr.message); process.exit(1); }
  console.log("✅ תוקן ניקוד: פֻרְצֵה → פֻרְצַה");
}

main();
