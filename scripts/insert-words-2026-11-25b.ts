// Ariel, 25.11.26 (second list): תלג' = שלג, and חמאם = יונים (not חַמַּאם = שירותים; the difference is the shadda).
// שלג is new. חַמַאם = יונים already exists: it gains its single (חַמַאמֵה, MuFeed) and a note against the bathroom.
// Old notes/plural backed up to scripts/data/hamam-pigeons-backup-2026-11-25.json.
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js"; import { writeFileSync } from "fs";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const LESSON = "מילים 25.11.26";
(async () => {
  const { data: snow } = await sb.from("cards").select("id").in("arabic_script", ["ثلج", "تلج"]);
  const { data: pig, error } = await sb.from("cards").select("id,translit_nikud,hebrew_meaning,notes,plural_form").eq("arabic_script", "حمام").eq("hebrew_meaning", "יונים");
  if (error) throw error;
  console.log("snow existing:", snow?.length, "pigeon card:", pig);
  if (!APPLY) return console.log("dry run — add --apply");
  if (!snow?.length) {
    const { data: l } = await sb.from("lessons").select("id").eq("title", LESSON).single();
    const { data: c, error: e1 } = await sb.from("cards").insert({ translit_nikud: "תַלְג'", arabic_script: "ثلج", hebrew_meaning: "שלג, קרח", item_type: "word", lesson_id: l!.id, chatifai_verified: false, mufeed_verified: false, notes: "מופיד: תַ'לְג' (קרח). בדיבור ת" }).select("id").single();
    if (e1) throw e1;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: c.id, direction: "he_to_ar" }); if (e2) throw e2;
    console.log("+ תַלְג'");
  }
  if (pig?.length === 1) {
    writeFileSync("scripts/data/hamam-pigeons-backup-2026-11-25.json", JSON.stringify(pig, null, 2));
    const add = "יונה אחת: חַמַאמֵה (מופיד)";
    // Applied: the old note "בלי דגש! …" became "בלי שדה! חַמַּאם (בשדה) = שירותים / אמבטיה. " + add
    const notes = pig[0].notes ? `${pig[0].notes}. ${add}` : add;
    const { error: e3 } = await sb.from("cards").update({ notes, hebrew_meaning: "יונים (יונה: חַמַאמֵה)" }).eq("id", pig[0].id);
    if (e3) throw e3;
    console.log("~ חַמַאם updated");
  }
  console.log("✅ done");
})();
