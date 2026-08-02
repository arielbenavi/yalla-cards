// Closes notes by id prefix. Replaces the one-off mark-notes-done.ts pattern.
//
//   npx tsx scripts/close-notes.ts 0c2ddbd9 f1ed64e1
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const prefixes = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (!prefixes.length) throw new Error("usage: close-notes.ts <id-prefix>...");

  // LIKE against the uuid column does not match in PostgREST — prefix-match here.
  const { data } = await sb.from("notes").select("id, body").eq("status", "open");
  for (const p of prefixes) {
    const hit = (data ?? []).find((n) => n.id.startsWith(p));
    if (!hit) {
      console.log(`⚠️  ${p} — לא נמצא בין הפתוחות`);
      continue;
    }
    const { error } = await sb
      .from("notes")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", hit.id);
    if (error) throw error;
    console.log(`✅ ${hit.id.slice(0, 8)}  ${hit.body.slice(0, 70)}`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
