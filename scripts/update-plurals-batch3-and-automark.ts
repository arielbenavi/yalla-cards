import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  // ── Batch 3: chatifai results ─────────────────────────────────────────
  const batch3 = [
    { id: "3ccc63ba-4a77-401e-b312-d8334796abc5", plural_form: "חֻכַּאם",               label: "חַכַּם (שופט)" },
    { id: "281f483e-f982-4069-b0b5-05aa6dde1acc", plural_form: "מַחַאדֵד",             label: "מַחְדַּדֵה (מסגריה)" },
    { id: "5ca4e080-bb9f-4be3-9c7c-ee851857bc46", plural_form: "דַּהַּאנִין",           label: "דַּהַּאן (צבעי)" },
    { id: "48a5131c-53af-4318-bde7-8d11a6542ddf", plural_form: "עַטַּארִין",            label: "עַטַּאר (מוכר בשמים)" },
    { id: "efdd4230-c1ab-4a83-a0df-3519782c8316", plural_form: "נִעַם",                label: "נֶעֶמֶה (ברכה)" },
    { id: "9e1cdf79-aef5-4482-a061-71b3fc367148", plural_form: "מֻתְקַאעְדִין",        label: "מֻתְקַאעֶד (פנסיונר)" },
    { id: "65051d70-da46-4881-8658-4986f8a577d9", plural_form: "מֻבַּרְמְגִ'ין",       label: "מֻבַּרְמֶג׳ (מתכנת)" },
    { id: "a3f96d3a-f1d0-4fbe-8e4d-fa2cf112e7a0", plural_form: "מֻדַרִּבַּאת",        label: "מֻדַרִּבֶּה (מאמנת)" },
    { id: "f900fbc6-1873-4bf8-a4ef-eb062929f870", plural_form: "בַּרַאבִּישׁ",         label: "בַּרְבִּישׁ (צינור)" },
    { id: "87d7394e-4379-4404-a936-e474d7c4de7b", plural_form: "סֻטוּל / דַלַאוִי",    label: "סַאטֶל/דַּאלוּ (דלי)" },
    { id: "23fd444c-7456-47fc-9d5d-051e2ef89fe6", plural_form: "שַעְ'לַאת",            label: "שַעְ'לֵה (עניין/נושא)" },
    { id: "970d237e-8cb4-475e-9723-0ba97f71d6ac", plural_form: "אֻמַנַאא",             label: "אַמִין (מזכיר)" },
    { id: "3496dd40-5d72-49bf-9c62-7309acc8eb06", plural_form: "אֻמַנַאא",             label: "אַמִין (dup)" },
    { id: "d8215153-662d-4607-81c2-9ae67450905a", plural_form: "אַמִינַאת",            label: "אַמִינֶה (מזכירה)" },
    { id: "2a53b749-9055-4d09-b1c1-b59dab97f64f", plural_form: "אַמִינַאת",            label: "אַמִינֵה (dup)" },
    { id: "af504179-71ea-4c0e-88e9-970b41b776a7", plural_form: "חַבִּיבַּאת",          label: "חַבִּיבֵּה (אהובה)" },
    { id: "b2f15284-89f7-4bcd-b007-24ca66ec051a", plural_form: "—",                   label: "נֻצְרַה (ניצחון - מופשט)" },
    { id: "caf5afea-a726-4951-ae5c-d80436605a0d", plural_form: "—",                   label: "זֵית (שם קיבוצי)" },
    { id: "4ad601ce-f889-4bd0-8cc2-ad35f144eeeb", plural_form: "שֻמוּס",              label: "שַמְס (שמש - נדיר)" },
    { id: "3ff5cfae-6d79-4ab9-af60-f2e3016b7a34", plural_form: "אַדְוַאר",            label: "דוֹר (תור)" },
    { id: "8990991f-e8c6-4a0e-afc6-5bde3c259af8", plural_form: "—",                   label: "אַהְוֵה (קפה - שם קיבוצי)" },
    { id: "a9b2bdcb-8ae5-445c-986e-bc1cb4acc3e4", plural_form: "פַנַּאנַאת",           label: "פַנַּאנֵה (אומנית)" },
  ];

  // ── Auto-mark: no plural (numbers, cities, prepositions, verbs, adjectives, abstract, etc.) ──
  const noPlural = [
    // Numbers 1-20
    "65c05d24-892b-4349-83bd-e0e1fc7f5efc", "2240e2ee-bc21-4921-95a0-22682cfdcfb4",
    "d7a9c94e-7dd5-4593-944f-9963ea81b9d7", "78a089cb-53d3-4c34-a367-4f64ff63f548",
    "8b521738-35d6-45d7-a308-1d3af7694621", "33405a01-d3d2-492f-a5ad-71aaf601c278",
    "e6a8681a-e0f3-4d7b-9d91-646c13c4a71f", "29de8649-ea01-41d1-adc6-9298d628e76f",
    "1aa842bb-007b-4e72-b059-c056a6f2eddf", "59b222ad-3749-4b18-b3b0-96183d2ce7cb",
    "70ad1a93-d239-447b-8041-c0a4391b5fb4", "d5c284d9-3a51-49c6-85f0-f820f5b8a887",
    "670dca59-5be2-4685-af5d-dc7b12148f08", "6c1654ec-3c55-49b1-9632-e2591ea9fc19",
    "35891e7f-b061-45db-9f57-0bc15ec3f48e", "57b3068a-3adc-43ea-9ea0-6a8241a84098",
    "7f2cf4f1-8c03-4f4b-b1dd-611362f7df12", "2dc77357-c07f-4ebe-8090-e682a867283b",
    "dc0a5834-1b99-41f6-94bb-ce952d1083b6", "39f2445d-45f5-4e4c-9339-29fc6a75201b",
    // Cities / proper nouns
    "25440ea8-70ab-485c-afdb-9f9b0c7c79fe", "4247c9e2-33fb-4e2e-ae42-b90af5db7a09",
    "f603bf50-1dcc-4824-ba7b-7b0df0ba8962", "1aece150-cd9a-405d-91b7-72bdc3080dd6",
    "7debb1e8-9c7c-4a1b-91d2-751a5a32a441", // עלי - שם גבר
    // Prepositions / conjunctions / adverbs
    "721d451b-a09e-484e-81c1-32fc776bf35a", "194982e8-b75e-4e80-9608-19d0cd5940a5",
    "0b4e67f2-38ed-462b-a24b-b5844312de7a", "baa52a32-7b3d-46fb-92c1-6edad97bbcc6",
    "c1a2fc93-bb84-41eb-9a7b-441842f798ac", "4a8039f2-15f0-4442-9758-2085a189db4c",
    "36413f6b-764f-427e-844e-9722e637d2d1", "263bd50d-9cee-4830-b5a0-419ae115ce40",
    "538efd3c-5c9c-4245-b651-37cab2b13622", "8c8811bd-f743-480f-88c7-219ff4e4ab26",
    "d2ae45b1-1091-4ec8-b79f-61a5317d9945", "c8863ced-92a6-49a2-98b6-ba689a4fc468",
    "fd7ebc25-6ac4-456a-b7ad-a9d2c1d97abf", "6b38aa40-6711-4b75-9013-cf91dbf69692",
    "1776f6eb-9f0f-405a-a77b-7d7e0a29418e", "fec3bf6d-0cf5-4dc0-acb8-947fa5573480",
    "001894c9-32d5-4634-9ad1-703c17c2610b", "8509be70-6d95-4b65-bd71-a1708098db05",
    "6e937d97-4666-4d72-b03e-9cfcfdfd0aab", "e090f27c-b5b1-41fc-9378-e31e53b467ff",
    // Demonstratives / pronouns
    "bd54dc4a-f1c8-4f3c-be3e-098f8ef8cab9", "1155d8b7-9f5b-4e3d-9e05-33ca43ab54a8",
    "3952f577-72fd-4117-a6ce-3f70c1f94d1a", "3e61b9e2-b858-4d58-812d-6ed105b2a5a3",
    "0d1d72fe-25d9-4d02-a7b5-4130ab1ecb94", "8f20b701-3474-4430-84a9-969aa41900ce",
    "f39ddca4-464c-4f39-86a2-4b7e9f3e2023", "58171ee2-8dfb-4b56-a56c-ab9bbe75fa4f",
    "4950031e-e980-4666-96a5-4df5a375882d",
    // Negation / existential
    "0d1e3178-43e7-4025-a95e-32c1bd4c9bec", "66a756e0-7d1e-49cb-81d3-f0f180b04aec",
    "c720107c-bcdc-42c2-811a-884141ad4a48", "d1815f30-3b83-471f-80b7-4f1e384f39dc",
    "a0c775e1-d3d7-44c8-b5e0-f239cf8e06bf",
    // Verbs / verb forms
    "f10b1eef-63f6-4169-aeca-96805172e603", "353b77f7-e528-4886-a52d-8234d27c221c",
    "c6219e7c-c044-48ca-9221-c10d8b274733", "a5bf7d8d-0862-4990-a0cd-9988ba20c5e4",
    "566bb52a-f8a2-4ccc-ab7f-f0c042f11cb7", "b89d603c-7298-4889-8303-de3f6ce3f18a",
    "1495eaf3-514e-425a-a91b-b07cbf9f5474", "546c4197-2ed3-470f-9c56-0d2909e2f253",
    "8923574d-b3cc-47e0-8f73-4ef4cb8e6a6d", "b7a2bce3-322f-443a-896d-5d337aeb36f5",
    // Adjectives
    "a20210e4-ec3b-4582-8ee4-665d69233154", "7b718f02-10e1-40f3-acab-6c33cb25e686",
    "cce144c6-f76d-4bfa-8404-493e2d110aa3", "95d04df0-f431-4178-ba50-17b8b9ce1c05",
    "6a38bc82-51f9-40aa-88af-0a9a17709f45", "dc57c368-65a3-468f-9a18-eff920ac7590",
    "0a5b3841-132c-47da-a119-1a44dace5aba", "369e65c6-848a-48d3-a0bc-b9732a48efa0",
    "b3415534-4005-4791-8c10-5019afaa6c88", "a2670cf3-dc78-424c-9ef1-60245b55b548",
    "a11c849e-d345-408c-a5f3-7a23ee664973", "fc22d87e-f526-4541-9c33-64afe9dd396e",
    "400bcf26-ced6-44cf-a2a3-4eb4ae9563e8", "bf11d7dc-7628-432a-b521-ffac3c662515",
    "301cb9d7-d417-4614-9e71-4d8ad3ba31da", "f99b2a22-9217-4c23-972f-8be1805392d1",
    "d537930a-1bd6-4ac3-8b94-79b09f7658cc",
    "7cbc19e7-3966-4bf3-9533-18908ed4664d", "12c69d97-8e1e-4776-bacd-87347b86b68b",
    "8fa2367e-134b-4892-8c6f-9fb1533a33a3", "laz", // placeholder - remove
    // Greetings / exclamations
    "bc4ed9c5-59d1-4f44-a33a-eeec96883d94", "f9f9b1e9-688f-4c51-a935-8a18891ea9e3",
    "30c1bd81-7ec2-4dea-99d7-465fde2ba43b", "ba079e5c-fe03-4ce4-9785-0f7be353c66a",
    "ada86d3f-aac8-4eda-b8ce-0f667dbe4a95",
    // Dual forms (not really a plural concept)
    "214fe909-0d54-41ce-bfbb-37545ecddc66", "9bcaffab-6a28-40d3-a0e3-a828e7b62eb9",
    // Already plural / collective
    "5be831df-9a55-41cb-8d0c-15ead2839c9e", // וְלַאד ילדים
    "25e76392-05d9-48a8-9d71-7fe71490f51d", // חֻ'טוּט קווים
    "31e90105-6158-476a-b3ca-83dddeda6eb3", // חַמַאם יונים
    "5f270cdd-350d-4814-9678-e7f9d3f59008", // סַגַ'ר עצים (קיבוצי)
    "2a5312d2-fe58-436a-9397-08b91c4a03e9", // חַשִיש דשא (קיבוצי)
    "ed4c97fa-8c02-4353-b813-09c599f50979", // דֻחַ'אן עשן/סיגריות
    "42bef10c-e69c-4839-816b-9efb23f9a4b1", // סֻכַּּאן תושבים
    "748a956d-f6c1-455d-8ab8-0ac9f0270fb1", // מַצַארִי כסף
    "f8fd419c-855c-412d-8c4c-57e378dfde8a", // מַרַּאת פעמים
    // Abstract / uncountable
    "95dedd7b-6fd3-4a81-a8d7-9a61150afbaf", // מֻחַאמַאה עריכת דין
    "02ea5e2f-5eda-4e17-9329-16a57deea85d", // dup
    "8ebc3057-fcc8-476c-a651-d6eaa60fd7e0", // עַדֶל צדק
    "a11ee779-fbdd-40fb-a440-a36befd60d7c", // dup
    "7907f75e-3289-4d69-919a-5fc67617a315", // סַלַאמֶה בריאות
    "aecdba86-a2d5-4dd0-bcba-e60da02cef97", // dup
    "a91d4c9f-c661-4998-b155-38f8abc7cd84", // צִחַּה בריאות
    "9535e39d-9342-43b9-9105-90298bfe1e63", // סֻכַּר
    "a5b46935-33fa-45b1-86eb-cf859417a062", // dup
    "95090158-eb0d-496e-9466-b8afbe1d56f8", // אַצְל מקור
    "81c5173e-45a6-4770-b3bd-199829388690", // תַעַארוּף היכרות
    "36b44ec2-660e-49e3-bf43-913d9173b28a", // חַכִּי דיבור
    "0037ffa1-d935-412b-8bbb-50dd9e80e9e7", // פַן אומנות
    "4be90cef-01bd-470a-bfb1-e697199b5e07", // אַהֶל הורים
    "687c4c6f-a3bf-4736-bc55-8726676d68b2", // שַדֶּה לחץ
    "30b82b23-4d84-40bf-a614-fd27e594e053", // סְוַאקַה נהיגה
    "579cf914-f762-41bf-a5e8-70bdf42ef575", // סֵיר נסיעה
    "ac76075a-463d-468d-bb1d-aa7ecd68ac48", // שַׁי/אִשִי משהו
    "67f5465c-7b63-4224-984f-9c7e26db3039", // אִשִי משהו
    "fe03636f-cb63-4d4d-97a8-945c9c420afc", // אִסְלַאם
    // Directions (no plural)
    "86f4b1d5-4194-4077-aa53-c12aac064c84", // שַמַאל צפון
    "f512bfa0-447e-4d17-a3c3-a2185fcd8cea", // יַמִין ימין
    "1b67c3dd-9d32-4fbc-901c-65448128e82e", // שְמַאל שמאל
    // Time of day (no plural)
    "9b62ae3e-5698-475b-a8d5-4328ecf4d53e", // צֻ'הֻר צהריים
    "c2d4d9cc-20f1-4d77-8f39-fd1430bc8b1b", // (אל)צֻּבֻּח הבוקר
    // Other
    "4ea156ec-f3df-4412-b940-b7865125076e", // אֵיר פין
    "2200dffd-8af3-48d0-84e3-382cab7af59d", // אַבּוּי אבא שלי
    "d515ae92-8345-47c4-81cd-3a37e9da939d", // אִמִּי אמא שלי
    "451e64f7-d84b-475a-a544-07bb05ac63ee", // בַּסִיטַה לא נורא
    "7e920284-5e9b-4543-9176-9a33255a71c7", // מַעַכּ איתך
    "128de037-eeb0-42c7-8900-fa607d3ad5df", // כְּתִיר הרבה
    "8943f49f-18c0-46d4-8b55-45c705d116e8", // עֵנְד יש/אצל
    "3ba4a709-6e16-4efb-aa82-5176bb652c35", // בֵּית (בית) - same as דַּאר, already covered
    "c9101c94-70e0-476c-b8c7-e2e930148893", // זֵיתוּן זיתים (collective noun)
    "69ad5cbb-5a48-4908-a067-c945494093d3", // שַאי dup - already done
    "4741c5df-4535-4f1c-8054-9f4576d4bb63", // דַרַג' - already has plural in DB
  ].filter(id => id !== "laz"); // remove placeholder

  console.log("=== Batch 3 updates ===");
  for (const u of batch3) {
    const { error } = await sb.from("cards").update({ plural_form: u.plural_form }).eq("id", u.id);
    if (error) console.error(`✗ ${u.label}: ${error.message}`);
    else console.log(`✅ ${u.label} → ${u.plural_form}`);
  }

  console.log("\n=== Auto-mark no-plural ===");
  const chunkSize = 20;
  for (let i = 0; i < noPlural.length; i += chunkSize) {
    const chunk = noPlural.slice(i, i + chunkSize);
    const { error } = await sb.from("cards").update({ plural_form: "—" })
      .in("id", chunk);
    if (error) console.error(`chunk ${i}: ${error.message}`);
    else console.log(`✅ chunk ${i}-${i + chunkSize}: marked —`);
  }

  // Final count
  const { count } = await sb.from("cards").select("id", { count: "exact", head: true })
    .eq("item_type", "word").is("plural_form", null);
  console.log(`\nנשארו ${count} מילים בלי plural_form`);
}
main();
