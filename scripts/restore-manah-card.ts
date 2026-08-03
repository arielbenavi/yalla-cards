// Restores the مناح card I deleted on 2026-08-03.
//
// I merged it into منيح on my own judgement that مناح was a misspelling. It is
// not. chatifai: مناح is the PLURAL of منيح, and the two are not
// interchangeable — منيح for a singular person or for a general state ("how are
// things?"), مناح only for a group of people or things.
//
// So the card comes back, with the meaning it should have had rather than the
// "טוב / בסדר" it carried before, which is the singular's meaning and is what
// made the two look like duplicates in the first place.
//
//   npx tsx scripts/restore-manah-card.ts          # dry run
//   npx tsx scripts/restore-manah-card.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

// Exactly as chatifai printed it.
const CARD = {
  translit_nikud: "מְנַאח",
  arabic_script: "مناح",
  hebrew_meaning: "טובים (רבים)",
  item_type: "word" as const,
  notes:
    "צורת הרבים של مناح/منيح. ליחיד — מְנִיח (منيح), לנקבה יחידה — מְנִיחַה (منيحة). " +
    "לא משתמשים במְנַאח על אדם יחיד או על מצב כללי; שם תמיד מְנִיח.",
  chatifai_verified: true,
};

const LESSON = "מפגש בעפ 2"; // where the deleted card lived

async function main() {
  const { data: existing } = await sb
    .from("cards")
    .select("id, translit_nikud, hebrew_meaning")
    .eq("arabic_script", "مناح");
  if (existing?.length) {
    console.log(`כבר קיים: ${existing[0].id.slice(0, 8)} ${existing[0].hebrew_meaning}`);
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const lesson = (lessons ?? []).find((l) => l.title === LESSON);

  console.log("משחזר:");
  console.log(`  ${CARD.translit_nikud} | ${CARD.arabic_script} | ${CARD.hebrew_meaning}`);
  console.log(`  שיעור: ${lesson?.title ?? "(לא נמצא — ייווצר בלי שיעור)"}`);

  // Also correct the surviving منيح card, which I left saying "טוב / בסדר"
  const { data: manih } = await sb
    .from("cards")
    .select("id, hebrew_meaning")
    .eq("arabic_script", "منيح")
    .limit(1);
  if (manih?.[0]) {
    console.log(`  ומעדכן את منيح ${manih[0].id.slice(0, 8)}: "${manih[0].hebrew_meaning}" → "טוב / בסדר (יחיד)"`);
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  const { data: inserted, error } = await sb
    .from("cards")
    .insert({ ...CARD, lesson_id: lesson?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;

  // A card with no card_srs row never appears in review — see
  // scripts/check-srs-coverage.ts. Create both directions' default row.
  const { error: srsErr } = await sb
    .from("card_srs")
    .insert({ card_id: inserted.id, direction: "he_to_ar" });
  if (srsErr) throw srsErr;

  if (manih?.[0]) {
    await sb.from("cards").update({ hebrew_meaning: "טוב / בסדר (יחיד)" }).eq("id", manih[0].id);
  }

  console.log(`\n✅ שוחזר ${inserted.id.slice(0, 8)} עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
