// Closes notes db4e9d5e and 6b4e5af0.
//   db4e9d5e — "הצלחה / תופיק" should just read "הצלחה"; תופיק is the given name,
//              which the card's notes field already records.
//   6b4e5af0 — כַּמַאן already exists as a card; the chatifai explanation from the
//              note belongs in its notes field, not in a new duplicate card.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const TAWFIQ = "95d9be87-7b99-4f0c-9059-0a712b5d405f";
const KAMAN = "c1a2fc93-bb84-41eb-9a7b-441842f798ac";

const KAMAN_NOTES = `אחת המילים הכי שימושיות בפלסטינית. שלושה שימושים:

1. "עוד" — להוסיף משהו. שם הדבר ואז כַּמַאן:
   בִּדִּי קַהְוֵה כַּמַאן = אני רוצה עוד קפה
   כַּמַאן שְוַיְ = עוד קצת / בעוד זמן קצר

2. "גם" — כשמשהו נכון גם לגביך או לגבי מישהו אחר:
   אַנַא כַּמַאן = גם אני
   הֻוֵ כַּמַאן גַ'איְ = גם הוא בא

3. הדגשה — "בנוסף לזה" / "שוב":
   קַאל לִי כַּמַאן מַרַה = הוא אמר לי עוד פעם

(chatifai)`;

async function main() {
  const { error: e1 } = await sb
    .from("cards")
    .update({ hebrew_meaning: "הצלחה" })
    .eq("id", TAWFIQ);
  if (e1) throw e1;
  console.log("✅ תַוְפִיק → hebrew_meaning = \"הצלחה\"");

  const { error: e2 } = await sb.from("cards").update({ notes: KAMAN_NOTES }).eq("id", KAMAN);
  if (e2) throw e2;
  console.log("✅ כַּמַאן → notes set");

  // LIKE against a uuid column doesn't match in PostgREST — fetch and prefix-match here
  const { data: open } = await sb.from("notes").select("id").eq("status", "open");
  for (const prefix of ["db4e9d5e", "6b4e5af0"]) {
    const hit = (open ?? []).find((n) => n.id.startsWith(prefix));
    if (!hit) {
      console.warn(`⚠ note ${prefix} not found among open notes`);
      continue;
    }
    await sb.from("notes").update({ status: "done" }).eq("id", hit.id);
    console.log(`✅ note ${prefix} → done`);
  }
}

main();
