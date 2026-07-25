import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data, count } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, plural_form", { count: "exact" })
    .eq("item_type", "word")
    .is("plural_form", null)
    .order("created_at", { ascending: true });

  console.log(`סה"כ מילים בלי רבים: ${count}`);
  data?.forEach((c) =>
    console.log(`${c.id} | ${c.translit_nikud.padEnd(22)} | ${c.hebrew_meaning}`)
  );
}

main();
