/**
 * Resolves the 24 chatifai disagreements:
 * - Where chatifai gave a single better form → overwrite
 * - Where chatifai gave "A / B" and stored is just "A" → append chatifai's additions
 * - Special case ג'מב/ג'נב: both valid → stored "جمب / جنب"
 * All resolved cards → chatifai_verified = true
 * Run: npx tsx scripts/resolve-arabic-disagreements.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

// Each entry: stored arabic_script → new arabic_script to set
const resolutions: { stored: string; updated: string; note?: string }[] = [
  { stored: "هذيك",    updated: "هديك",         note: "chatifai form" },
  { stored: "هادي",    updated: "هادي / هاي",   note: "append alternate" },
  { stored: "تبع",     updated: "تبع / تاع",    note: "append alternate" },
  { stored: "تمانطعش", updated: "تمنطعش",       note: "chatifai form" },
  { stored: "خمسطعش",  updated: "خمستعش",       note: "chatifai form" },
  { stored: "هدول",    updated: "هدولا",         note: "chatifai form" },
  { stored: "هذاك",    updated: "هداك",          note: "chatifai form" },
  { stored: "سكرتيرا", updated: "سكرتيرة",      note: "correct feminine ة" },
  { stored: "بحكي",    updated: "بيحكي",         note: "chatifai form" },
  { stored: "خزانة",   updated: "خزان",          note: "Palestinian form" },
  { stored: "تلطعش",   updated: "تلاتعش",       note: "chatifai form (13)" },
  { stored: "ثانية",   updated: "تانية",         note: "Palestinian ت not ث" },
  { stored: "في",      updated: "بـ / في",       note: "append preposition form" },
  { stored: "عم",      updated: "عم / عمة",      note: "append feminine" },
  { stored: "صغير",    updated: "زغير",          note: "Palestinian colloquial" },
  { stored: "سطل",     updated: "سطل / دلو",    note: "append alternate" },
  { stored: "متأسف",   updated: "آسف",           note: "Palestinian form" },
  { stored: "إشي",     updated: "شي / إشي",     note: "prepend common form" },
  { stored: "احكي",    updated: "أحكي",          note: "correct hamza" },
  { stored: "جمب",     updated: "جمب / جنب",    note: "both valid in dialect" },
  { stored: "فيش",     updated: "فش",            note: "chatifai form" },
  { stored: "أو",      updated: "أو / ولا",     note: "append alternate" },
  { stored: "إمي",     updated: "أمي",           note: "correct hamza" },
  { stored: "إطلع",    updated: "اطلع",          note: "Palestinian hamzat wasl" },
];

async function main() {
  let updated = 0;
  let notFound = 0;

  for (const r of resolutions) {
    const { data, error } = await sb
      .from("cards")
      .update({ arabic_script: r.updated, chatifai_verified: true })
      .eq("arabic_script", r.stored)
      .select("id, hebrew_meaning");

    if (error) {
      console.error(`❌ "${r.stored}": ${error.message}`);
    } else if (!data || data.length === 0) {
      console.warn(`⚠  not found: "${r.stored}" (${r.note})`);
      notFound++;
    } else {
      data.forEach((c: { id: string; hebrew_meaning: string }) =>
        console.log(`✅ ${c.hebrew_meaning}: "${r.stored}" → "${r.updated}" (${r.note})`)
      );
      updated += data.length;
    }
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found`);
}

main().catch((e) => { console.error(e); process.exit(1); });
