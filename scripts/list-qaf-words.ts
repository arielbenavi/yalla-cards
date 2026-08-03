// Every distinct word in the cards that contains ק, for chatifai's final ق ruling.
// ק only ever transliterates ق in this system (ك is כּ), so this is the exact
// scope of the pending convention change.
//   npx tsx scripts/list-qaf-words.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false }, realtime: { transport: class {} as any },
});
async function main() {
  const words = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("cards").select("translit_nikud, item_type").range(from, from + 999);
    if (!data?.length) break;
    for (const c of data) {
      for (const w of (c.translit_nikud ?? "").split(/[\s־]+/)) {
        if (!w.includes("ק")) continue;
        const k = w.replace(/[.,?!״"'’]/g, "").trim();
        if (k.length > 1) words.set(k, (words.get(k) ?? 0) + 1);
      }
    }
    if (data.length < 1000) break;
  }
  const sorted = [...words.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`${sorted.length} מילים מנוקדות עם ק\n`);
  for (const [w, n] of sorted) console.log(`${String(n).padStart(3)}× ${w}`);
}
main();
