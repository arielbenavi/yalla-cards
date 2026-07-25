import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, notes, clip_path, plural_form, lesson_id, created_at")
    .or(
      "hebrew_meaning.ilike.%מסגד%,translit_nikud.ilike.%חזאן%,hebrew_meaning.ilike.%מרפסת%," +
      "translit_nikud.ilike.%בלקונה%,translit_nikud.ilike.%בלכונה%,translit_nikud.ilike.%ברנדא%," +
      "translit_nikud.ilike.%דרג%,hebrew_meaning.ilike.%מדרגה%"
    )
    .order("hebrew_meaning");

  data?.forEach((c) =>
    console.log(
      `${c.id} | ${c.hebrew_meaning.padEnd(25)} | ${c.translit_nikud.padEnd(20)} | ar:${c.arabic_script ?? "—"} | clip:${c.clip_path ? "✓" : "✗"} | pl:${c.plural_form ?? "—"}`
    )
  );
}

main();
