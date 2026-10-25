// Restores three notes wiped by mistake while stripping Leyla's literary notes
// (2026-10-24). Text taken from the scripts that wrote them:
// merge-duplicates.ts, data/meeting-6.ts, data/song-vocab.ts.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
(async () => {
  const set = async (tr: string, notes: (old: string | null) => string) => {
    const { data: c } = await sb.from("cards").select("id, notes").eq("translit_nikud", tr).single();
    const { error } = await sb.from("cards").update({ notes: notes(c!.notes) }).eq("id", c!.id);
    if (error) throw error;
    console.log("✅", tr, "→", notes(c!.notes).slice(0, 90));
  };
  await set("מַסְגִ'ד", () => "שתי צורות מקובלות: מַסְגִ'ד (פורמלי/ספרותי) וגַ'אמֵע (שימוש יומיומי). גַ'אמֵע גם מוגה גַ'אמַע.");
  await set("אִלְחַמְדֻלִלַּה", () => "תומר: הביטוי מגיע מהערבית הספרותית");
  await set("אִדַּ'בַּאבִּי", (old) => (old ?? "").replace("מהשיר: Konna Netlaka · ", "מהשיר: Konna Netlaka · chatifai: ספרותי; ברחוב פִי צְ'בַּאבּ · "));
})();
