import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const updates = [
    { id: "1776f6eb-c9ee-405a-a77b-7d7e0a29418e", plural_form: "—",          label: "מִנּ (מ.. - מילת יחס)" },
    { id: "09106f3e-5f47-4cb2-9a38-df8aaa9b7141", plural_form: "—",          label: "פוּל (פול - שם קיבוצי)" },
    { id: "11b2bd58-1728-4da5-b9c2-64b15f00caeb", plural_form: "—",          label: "פֻלּ (יסמין - שם קיבוצי)" },
    { id: "5f25ffe5-ecdd-402e-a3ac-483e678218df", plural_form: "כְּלַאבּ",   label: "כַּלְבּ (כלב - second card)" },
    // These already have plural in translit field (ר) — extract it for plural_form
    { id: "7be0b4ab-bfde-474f-b7c5-a26d865a8abd", plural_form: "עֻמוּם (דוד) / עַמַּאת (דודה)", label: "עַםּ (דוד/דודה)" },
    { id: "f9d53443-1ba6-41d6-b003-814519536b3a", plural_form: "אַחְ'וַאל (דוד) / חַ'אלַאת (דודה)", label: "חַ'אל (דוד/דודה מצד האם)" },
    { id: "0a5b3841-132d-4870-826c-fc6875f5561b", plural_form: "—",          label: "אַחְמַר (אדום - תואר)" },
    { id: "f56a7979-e37d-490f-844f-4f881c0156a6", plural_form: "—",          label: "זַעְלַאן (כועס - תואר)" },
    { id: "a07c6432-1ff4-48fa-b038-22a52446409d", plural_form: "מַחַאיִר",   label: "מֻחְ'תַאר (מוכתר)" },
  ];

  for (const u of updates) {
    const { error } = await sb.from("cards").update({ plural_form: u.plural_form }).eq("id", u.id);
    if (error) console.error(`✗ ${u.label}: ${error.message}`);
    else console.log(`✅ ${u.label} → ${u.plural_form}`);
  }

  const { count } = await sb.from("cards").select("id", { count: "exact", head: true })
    .eq("item_type", "word").is("plural_form", null);
  console.log(`\nנשארו ${count ?? 0} מילים בלי plural_form`);
}
main();
