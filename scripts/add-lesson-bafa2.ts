import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data, error } = await supabase
    .from("lessons")
    .insert({ date: "2026-07-31", title: "מפגש בעפ 2" })
    .select()
    .single();
  if (error) { console.error(error.message); return; }
  console.log("Created:", data.id, data.title, data.date);
}

main();
