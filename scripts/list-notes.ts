import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await s
    .from("notes")
    .select("id, body, tag, status, created_at")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); process.exit(1); }
  console.log(JSON.stringify(data, null, 2));
}

main();
