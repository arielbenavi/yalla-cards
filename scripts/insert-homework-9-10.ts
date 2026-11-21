// Adds the meeting 9 and 10 translation homework to /translate (paradigms, data.type = translation_drill).
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
import { HW9, HW10 } from "./data/homework-9-10";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const SETS = [
  { meeting: 9, slug: "book_translation_p151", data: { type: "translation_drill", dir: "he_to_ar", title: "משפטים לתרגום מעברית לערבית — מפגש 9", source: "עמ' 151–152, פתרון בעמ' 318–319", items: HW9 } },
  { meeting: 10, slug: "book_translation_p167", data: { type: "translation_drill", dir: "he_to_ar", title: "משפטים לתרגום מעברית לערבית — מפגש 10", source: "עמ' 167–168, פתרון בעמ' 322–323", items: HW10 } },
];
(async () => {
  for (const s of SETS) {
    await sb.from("paradigms").delete().eq("slug", s.slug);
    const { error } = await sb.from("paradigms").insert(s); if (error) throw error;
    console.log("✅", s.slug, s.data.items.length);
  }
})();
