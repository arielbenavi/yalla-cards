// Closes the notes delivered in the 2026-07-31 fast-track batch.
//   a8d25fe5 — old-lesson words in daily review (new cards now ordered newest-lesson-first)
//   c87bcd44 — "תמלל הכל" button + the post-upload sweep the note also asked for
//   5026562b — admin clip-range editing exposed on /review
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const PREFIXES = ["a8d25fe5", "c87bcd44", "5026562b"];

async function main() {
  const { data: open } = await sb.from("notes").select("id, body").eq("status", "open");
  for (const prefix of PREFIXES) {
    const hit = (open ?? []).find((n) => n.id.startsWith(prefix));
    if (!hit) {
      console.warn(`⚠ ${prefix} not found among open notes`);
      continue;
    }
    const { error } = await sb.from("notes").update({ status: "done" }).eq("id", hit.id);
    if (error) throw error;
    console.log(`✅ ${prefix} → done — ${hit.body.slice(0, 60)}`);
  }
}

main();
