import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// The suite runs against the real database and some tests mark practice tasks as done.
// Whatever marks a run adds are removed when it ends, so they never look like real practice
// (note c9a2a71b). A real mark made during a run would go with them; a run takes two minutes.
export default async function globalSetup() {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    realtime: { transport: class {} as never },
  });
  const { data } = await sb.from("daily_practice").select("id");
  const before = new Set((data ?? []).map((r) => r.id));
  return async () => {
    const { data: after } = await sb.from("daily_practice").select("id");
    const added = (after ?? []).map((r) => r.id).filter((id) => !before.has(id));
    if (added.length) await sb.from("daily_practice").delete().in("id", added);
  };
}
