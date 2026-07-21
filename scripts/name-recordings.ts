/**
 * Auto-names recordings based on their transcript_json content.
 * Run: npx tsx scripts/name-recordings.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

// Hand-crafted names from transcript previews
const NAMES: Record<string, string> = {
  "9dda3dba-4091-452e-87fb-89d3fc1448d1": "מפגש 2 – משפטים לתרגול (עמ' 16, אותיות שמש וירח)",
  "ed9e9539-96f5-4be5-bb45-c73f7f23262a": "מפגש 2 – נטיית שם עצם בזכר",
  "49037c70-366b-4177-9ecb-d5fd135a8034": "הפועל ביד – נטייה ושימוש",
  "21ecfa45-7fb3-49da-8a3e-d084a2812b33": "מפגש 1 – דו-שיח: מרחבא (סיאח)",
  "4c0703f7-7fb7-4453-abdf-434dcdaf7f0c": "פתגם – יא ז'ארי (שכן, אתה בביתך ואני בביתי)",
  "7b19042b-6ae3-40e8-9836-878caab24079": "פתגם – עש מן שפק (חי מי שראה אותך)",
  "8f13f01b-0791-4088-b444-bab73b0436a8": "מפגש 3 – משפטים לתרגול הסמיכות",
  "c0333632-5ccc-487f-bf5a-dc8528d7baac": "מפגש 3 – סיומות מילות יחס ושמות עצם (א/ו/י)",
  "88a6be51-db8f-4e6d-9f7c-4a9b5e90c75e": "מפגש 3 – תרגול כיוונים ומיקומים",
  "8479e7ac-a8a0-41f2-83ed-98c412dc6435": "מפגש 1 – תנועות ארוכות",
  "617d77a4-67ba-48df-b47d-bff3c0b1f686": "מפגש 3 – הסמיכות (הסבר)",
  "a43ce6e8-2cd1-46af-9e18-c63f72a2a105": "מפגש 3 – מילות יחס",
  "015474b8-1c57-475c-8a05-7abe97330581": "מפגש 1 – האותיות בכתב הערבי",
  "57f341f2-fe08-4121-ad28-6cb78aba2553": "מפגש 1 – האות ז'א",
  "8ea487f1-76f6-4d68-ba23-5dda670ed5c1": "מפגש 1 – הדגש (שַׁדָּה)",
  "2ac45d14-e3fc-4032-87d2-fa916d2dd5bd": "מפגש 1 – דגש ושעות היום",
  "de2350a7-5c48-49ac-8768-969adcb05c67": "מפגש 2 – אל התעריף (ה' הידיעה)",
  "80ca192a-4ece-48f5-93c1-e3a708910ade": "מפגש 1 – כינויי רמז: הילדה והילד",
  "21dfae1a-b497-4496-867b-40c0ee0abb3e": "מפגש 1 – אוצר מילים: ברכות",
  "843449b9-0c30-44f3-b6bf-9abc2a020be8": "מפגש 1 – אוצר מילים (המשך: משפחה)",
  "664c4555-3936-4c04-a730-4915d30ede68": "מפגש 2 – אותיות שמש ואותיות ירח",
  "8624ef71-1737-4027-a777-233e8ce45ba8": "מפגש 2 – נטיית השם בנקבה",
  "1d25b86d-6dff-480c-b636-b91cea77f07f": "מפגש 2 – תרגול כינויי רמז ונטיית שם",
  "fa614b18-8319-45d0-8ee8-3c989272f367": "מפגש 2 – נטיית שמות עצם זכר ונקבה (דוגמאות)",
  "c3122c0f-da14-4510-843a-b028ba7071ad": "מפגש 2 – אוצר מילים: אישה ונשים",
  "7e606a59-58d4-464d-8ab1-30a6a2173101": "מפגש 2 – אוצר מילים: זמן ודקות",
  "50313758-5e69-462f-bb73-9a9c19635f97": "מפגש 3 – סיום שם עצם נקבה (אותיות אחוריות/נחציות)",
  "a131a7a9-61e9-46c5-9962-5a01534b962a": "מפגש 1 – כינוי רמז (הדה/הדי)",
  "9ccfb30e-fa8e-42b5-b8a0-eb3c931d9da4": "מפגש 1 – דו-שיח: מה שלומך?",
  "11c983ef-30c5-4197-b365-1a536279b54a": "פתגם – בוקר טוב: ג'רק אל-חיר",
};

async function main() {
  let updated = 0;
  for (const [id, title] of Object.entries(NAMES)) {
    const { error } = await supabase.from("recordings").update({ title }).eq("id", id);
    if (error) { console.error(`ERROR ${id}:`, error.message); continue; }
    console.log("✓", title);
    updated++;
  }
  console.log(`\nUpdated ${updated} recordings`);
}

main().catch((e) => { console.error(e); process.exit(1); });
