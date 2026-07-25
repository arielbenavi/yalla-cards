import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const updates = [
    { id: "804fcd80-a1f7-443f-9276-f215bdbb7dcf", plural_form: "שֻרְטִיִּין",       label: "שֻרְּטִי (שוטר)" },
    { id: "e5e2a7c0-fa75-44ab-82f5-f3a49c258799", plural_form: "מַנַאטֵק",          label: "מַנְטַקַה (אזור)" },
    { id: "a095bf13-020b-4756-bb91-88fc0c81f840", plural_form: "טַיַּארַאת",        label: "טַיַּארַה (מטוס)" },
    { id: "03f99db1-fe9f-4074-997f-d14f076113f7", plural_form: "חֻרוּבּ",           label: "חַרְבּ (מלחמה)" },
    { id: "192b2289-62c3-4fad-936d-d7a668444a6e", plural_form: "סֻיוּף",            label: "סֵיף (חרב)" },
    { id: "53cba76a-3c41-46ee-8bb0-fb7d0f984f68", plural_form: "אִשְהֻר / שְהוּר", label: "שַהְר (חודש)" },
    { id: "f87f7231-d904-4c94-9217-6a8943dd0bcc", plural_form: "מַרַּאת",           label: "מַרַּה (פעם)" },
    { id: "c2e76df2-e49a-4bae-8a71-66834f69958c", plural_form: "אִבַּר",            label: "אִבְּרֵה (מחט/זריקה)" },
    { id: "c7123e1b-fbe1-461a-a437-f4ce9fb23aad", plural_form: "שֻקַק",            label: "שַקֵּה (דירה)" },
    { id: "5f25ffe5-9a55-41cb-8d0c-15ead2839c9e", plural_form: "כְּלַאבּ",          label: "כַּלְבּ (כלב)" },
    { id: "77444640-8387-44f4-92d5-64e801dcff2d", plural_form: "כַּלְבַּאת",        label: "כַּלְבֶּה (כלבה)" },
    { id: "4fbb0275-5bbc-48c7-9960-9481a78dbfdc", plural_form: "וְלַאד",            label: "וַלַד (ילד)" },
    { id: "35995fb2-3ded-4af9-9306-b9623c0a3ff5", plural_form: "מַכַּאתֵבּ",        label: "מַכְּתַבּ (משרד)" },
    { id: "ed136ea9-fe22-457a-bfcf-ac39a578c0e8", plural_form: "אַבְּוַאבּ",        label: "בַּאבּ (דלת/שער)" },
    { id: "3fc72a05-8f9e-439c-a105-6ac84f3f4926", plural_form: "גִ'בַּאל",          label: "גַ'בַּל (הר)" },
    { id: "eb7ccc99-916a-4232-9d64-3424c92d2af0", plural_form: "דֻרוּס",            label: "דַרְס (שיעור)" },
    { id: "178a6fc8-0fc4-4d8e-b521-f0cb9d1dc3a4", plural_form: "נֻכַּת",           label: "נֻכְּתֵה (בדיחה)" },
    { id: "e50fd7a6-0389-41a9-a885-435f55eac23f", plural_form: "פַנַּאנִין",        label: "פַנַּאן (אומן)" },
    { id: "f28240da-6d0b-43d7-93cd-db5ba97c8970", plural_form: "חְ'טוּט",           label: "חַ'ט (קו)" },
    { id: "c3af9bbb-4327-4c22-8f77-e4afcfa83581", plural_form: "כַּרַאגַ'את",       label: "קַארַאז׳ (מוסך)" },
  ];

  for (const u of updates) {
    const { error } = await sb.from("cards").update({ plural_form: u.plural_form }).eq("id", u.id);
    if (error) console.error(`✗ ${u.label}: ${error.message}`);
    else console.log(`✅ ${u.label} → ${u.plural_form}`);
  }
}
main();
