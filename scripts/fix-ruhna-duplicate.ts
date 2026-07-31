// "הלכנו" existed twice: רוּחְנַא (shuruk) and רֻחְנַא (kibbutz).
// chatifai gives רֻחְנַא / رحنا for אחנא in the past tense of راح, so the kibbutz
// form is the correct one. The shuruk card also carried the Arabic script the
// correct card was missing, so the script is copied over before it is deleted.
//
// Neither card has any review history, so nothing is lost.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const KEEP_PREFIX = "ba0b34"; // רֻחְנַא — correct vocalisation
const DROP_PREFIX = "36c818"; // רוּחְנַא — wrong vocalisation, has رحنا

async function main() {
  const { data: cards } = await sb
    .from("cards")
    .select("id, translit_nikud, arabic_script")
    .ilike("hebrew_meaning", "%הלכנו%");

  const keep = (cards ?? []).find((c) => c.id.startsWith(KEEP_PREFIX));
  const drop = (cards ?? []).find((c) => c.id.startsWith(DROP_PREFIX));
  if (!keep || !drop) throw new Error("expected both הלכנו cards to be present");

  // Refuse to delete anything that has been reviewed
  const { data: srs } = await sb.from("card_srs").select("id").eq("card_id", drop.id);
  const srsIds = (srs ?? []).map((s) => s.id);
  if (srsIds.length) {
    const { count } = await sb
      .from("review_log")
      .select("id", { count: "exact", head: true })
      .in("card_srs_id", srsIds);
    if ((count ?? 0) > 0) {
      throw new Error(`${DROP_PREFIX} has ${count} review_log rows — not deleting`);
    }
  }

  if (!keep.arabic_script && drop.arabic_script) {
    await sb.from("cards").update({ arabic_script: drop.arabic_script }).eq("id", keep.id);
    console.log(`✅ copied ${drop.arabic_script} → ${keep.translit_nikud}`);
  }

  await sb.from("card_srs").delete().eq("card_id", drop.id);
  const { error } = await sb.from("cards").delete().eq("id", drop.id);
  if (error) throw error;
  console.log(`✅ deleted ${drop.translit_nikud} (${DROP_PREFIX}), kept ${keep.translit_nikud}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
