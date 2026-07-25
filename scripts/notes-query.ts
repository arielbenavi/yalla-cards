import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const [,, cmd, ...args] = process.argv;

async function main() {
  if (cmd === "list") {
    const { data, error } = await sb
      .from("notes")
      .select("id, body, tag, status, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); process.exit(1); }
    console.log(JSON.stringify(data, null, 2));
  } else if (cmd === "done") {
    const id = args[0];
    const { error } = await sb.from("notes").update({ status: "done" }).eq("id", id);
    if (error) { console.error(error); process.exit(1); }
    console.log(`✅ marked done: ${id}`);
  }
}

main();
