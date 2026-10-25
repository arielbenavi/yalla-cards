// Ariel, 2026-10-24: ورقة is וַרְקַה (WarAa) — he heard it in a lesson recording.
// Was וַרַקֶה. Card text only.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
(async () => {
  const { error } = await sb.from("cards")
    .update({ translit_nikud: "וַרְקַה", notes: "פריט 55 · כך בהקלטה (WarAa); קודם: וַרַקֶה" })
    .eq("id", "cde33a5d-fd52-4879-9104-87e9c27897a3");
  if (error) throw error;
  console.log("✅ וַרְקַה");
})();
