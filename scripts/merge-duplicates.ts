import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  // ── מסגד ────────────────────────────────────────────────────────────
  // Keep: 9622548a (מַסְגִ'ד, clip ✓, plural already notes גַ'אמֵע)
  // Delete: 3de188b5 (גַ'אמֵע, clip ✓), 77359cf4 (גַ׳אמֶע, clip ✗)
  const { error: e1 } = await sb.from("cards").update({
    notes: "שתי צורות מקובלות: מַסְגִ'ד (פורמלי/ספרותי) וגַ'אמֵע (שימוש יומיומי). גַ'אמֵע גם מוגה גַ'אמַע.",
  }).eq("id", "9622548a-b1fa-4e9c-a0c5-e88154ed094f");
  if (e1) { console.error("מסגד update:", e1.message); } else { console.log("✅ מסגד notes עודכן"); }

  const { error: e2 } = await sb.from("cards").delete()
    .in("id", ["3de188b5-ad7a-4714-bb5d-0d85f2ec3109", "77359cf4-ddf0-439d-816c-cdd2c4e6416d"]);
  if (e2) { console.error("מסגד delete:", e2.message); } else { console.log("✅ 2 כרטיסיות מסגד נמחקו"); }

  // ── ארון / חזאן ──────────────────────────────────────────────────────
  // Keep: 5e3caee7 (חַ'זַאן, clip ✓)
  // Delete: 3ddabdfc (חַ'זַאנֵה, clip ✗), 6985d062 (חַ'זַאנֵה/כספת, clip ✓)
  const { error: e3 } = await sb.from("cards").update({
    hebrew_meaning: "ארון / כספת",
    translit_nikud: "חַ'זַאן / חַ'זַאנֵה",
    notes: "חַ'זַאן — הצורה הבסיסית. חַ'זַאנֵה — צורה נשית, גם לכספת או מגירה גדולה.",
    plural_form: "חַ'זַאנַאת",
  }).eq("id", "5e3caee7-75f4-4c7c-a8b6-4c76b48f9453");
  if (e3) { console.error("ארון update:", e3.message); } else { console.log("✅ ארון (חַ'זַאן) עודכן"); }

  const { error: e4 } = await sb.from("cards").delete()
    .in("id", ["3ddabdfc-6d78-42e2-8be5-48d08379bbbd", "6985d062-8a16-4af8-97b7-82a152ec4880"]);
  if (e4) { console.error("ארון delete:", e4.message); } else { console.log("✅ 2 כרטיסיות ארון נמחקו"); }

  // ── מרפסת ────────────────────────────────────────────────────────────
  // Keep: ac29af3f (בַּלְכּוֹנֵה / בַּרַנְדַא, clip ✗, plural ✓)
  // Transfer clip from: a0c4c38a (בַּרַנְדַא, clip ✓)
  // Delete: 105e9f32 (בַּלְקוֹנֵה, clip ✗), a0c4c38a (בַּרַנְדַא, clip ✓)
  const { data: balranda } = await sb.from("cards").select("clip_path, audio_start_sec, audio_end_sec, recording_id")
    .eq("id", "a0c4c38a-132c-47da-a119-1a44dace5aba").single();

  const { error: e5 } = await sb.from("cards").update({
    translit_nikud: "בַּלְכּוֹנֵה / בַּלְקוֹנֵה / בַּרַנְדַא",
    clip_path: balranda?.clip_path ?? null,
    audio_start_sec: balranda?.audio_start_sec ?? null,
    audio_end_sec: balranda?.audio_end_sec ?? null,
    recording_id: balranda?.recording_id ?? null,
  }).eq("id", "ac29af3f-b616-4da8-91d1-54da70b0a47e");
  if (e5) { console.error("מרפסת update:", e5.message); } else { console.log("✅ מרפסת עודכנה (translit + clip)"); }

  const { error: e6 } = await sb.from("cards").delete()
    .in("id", ["105e9f32-09a5-4d07-9716-d72af4d22f1f", "a0c4c38a-132c-47da-a119-1a44dace5aba"]);
  if (e6) { console.error("מרפסת delete:", e6.message); } else { console.log("✅ 2 כרטיסיות מרפסת נמחקו"); }

  // ── מדרגה (task 5) ───────────────────────────────────────────────────
  // Update: b1f287bc (דַרַגֵ'ה)
  const { error: e7 } = await sb.from("cards").update({
    notes: "דַרַג' = שם קיבוצי (המדרגות כמושג / הגרם כולו). דַרַגֵ'ה = מדרגה אחת. דַרַגַ'את = מדרגות כשסופרים אותן.",
  }).eq("id", "b1f287bc-8943-4135-af39-d01f9f824a54");
  if (e7) { console.error("מדרגה update:", e7.message); } else { console.log("✅ מדרגה notes עודכן"); }
}

main();
