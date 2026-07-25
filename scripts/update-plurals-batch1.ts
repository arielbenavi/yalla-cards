import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const updates: { id: string; plural_form: string; label: string }[] = [
    { id: "66c68488-e52b-42c1-9490-de7246992310", plural_form: "דוּר",               label: "דַּאר (בית)" },
    { id: "d0fdae42-70c4-493a-92ae-23f85fb100d3", plural_form: "חַמִיר",             label: "חְמַאר (חמור)" },
    { id: "48c2bee8-b3e5-4a64-863b-9fc8763743c2", plural_form: "אַיַּאם",            label: "יוֹם" },
    { id: "68fdf0a6-1cc1-45f4-bcf8-8b27a2962ba7", plural_form: "דֻוַל",             label: "דוֹלֵה (מדינה)" },
    { id: "5f0185c8-c6d7-44b1-83f3-4bad55a9b2c7", plural_form: "בַּנַאטִיל / בַּנְטַלוֹנַאת", label: "בַּנְטַלוֹן (מכנסיים)" },
    { id: "4b760b00-fa3f-4bed-9539-3918f59ccaa2", plural_form: "חֻכּוּמַאת",         label: "חֻכּוּמֶה (ממשלה)" },
    { id: "4b9143a1-bb98-43cd-a01a-adbc413e0d10", plural_form: "מֻדַרַאא",           label: "מֻדִיר (מנהל)" },
    { id: "4ba5fedf-aec7-4bba-be71-41448d1023ce", plural_form: "קֻמְצַאן",           label: "קַמִיצ (חולצה)" },
    { id: "82e5d569-1169-49a7-aa9d-27c2b02b88f3", plural_form: "מְעַלְּמִין",        label: "מְעַלֵּם (מורה)" },
    { id: "c5821ebd-77c8-4f3a-8e02-d5b9337ee902", plural_form: "—",                 label: "קַהְוֶה (קפה - שם קיבוצי)" },
    { id: "9a176d13-9406-4929-b682-b79e61c215b2", plural_form: "—",                 label: "שַאיְ (תה - שם קיבוצי)" },
    { id: "d6f4c4a1-1f68-40e0-bed8-1cda0b5f9296", plural_form: "מַחַאכֵּם",         label: "מַחְכַּמֶה (בית משפט)" },
    { id: "d10515d0-b9b4-459a-8eb6-ffad356d435b", plural_form: "חַדַּאדִין",         label: "חַדַּאד (מסגר)" },
    { id: "1f49c9e6-1a4b-4282-9911-feea9e82d2d9", plural_form: "נַגַּארִין",         label: "נַגַ׳אר (נגר)" },
    { id: "02501ccf-728e-44bd-88cc-a71129b4808b", plural_form: "כֻּרוּם",            label: "כַּרְם" },
    { id: "961e0107-b17f-40a1-8735-746b8a6b27ac", plural_form: "אַלְקַאבּ",          label: "לַקַבּ (כינוי)" },
    { id: "5e6c241c-88f8-466e-bde6-725c533eea52", plural_form: "גַ'מַאעַאת",         label: "גַ'מַאעֵה (חבורה)" },
  ];

  for (const u of updates) {
    const { error } = await sb.from("cards").update({ plural_form: u.plural_form }).eq("id", u.id);
    if (error) console.error(`✗ ${u.label}: ${error.message}`);
    else console.log(`✅ ${u.label} → ${u.plural_form}`);
  }
}
main();
