// 2026-11-07: the smoking cards after the first check-palestinian run against Madrasa.
// Text fixes on 7 cards created the same day (no reviews yet); FSRS state untouched.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const FIX: [string, Record<string, string>][] = [
  ["تدخين", { notes: "תואם מדרסה" }],
  ["دخّن / بدخّن", { notes: "תואם מדרסה. גם شرب سيجارة שִרֵבּ סִיגַארַה = עישן סיגריה" }],
  ["سيجارة / سجاير", { translit_nikud: "סִיגַארַה / סַגַאיֵר", notes: "תואם מדרסה (ג בלי גרש). גם دخان דֻחַ'אן = סיגריות" }],
  ["ولّاعة", { notes: "תואם מדרסה. גם قدّاحة קַדַּאחַה" }],
  ["تتن", { arabic_script: "تبغ", translit_nikud: "תַבַּע'", notes: "לפי מדרסה (גם תַבֵּע', תִבֵּע'). טבק לנרגילה: تمباك תֻמְבַּאכּ. גם دخان דֻחַ'אן" }],
  ["منفضة", { notes: "תואם מדרסה (מָנְפָצָ'ה)" }],
];
(async () => {
  const { data: l } = await sb.from("lessons").select("id").eq("title", "עישון — מילים שאריאל ביקש 7.11.26").single();
  for (const [ar, patch] of FIX) {
    const { data, error } = await sb.from("cards").update(patch).eq("lesson_id", l!.id).eq("arabic_script", ar).select("id");
    console.log(ar, error ?? data?.length);
  }
})();
