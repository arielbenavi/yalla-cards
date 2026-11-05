// A plural that has a card of its own moves onto its singular's card, where the back already shows
// it (Ariel, 2026-11-05: מַדְחַ'ל and מַדַאחֵ'ל are one word). Pairs were read by hand: a matching
// spelling alone gave false pairs like נֶעֶמֶה / נַעַם, and מְנִיח / מְנַאח stay findable through plural_form.
// A plural with review history is never deleted. A plural's clip moves to a singular with none.
// Old rows go to scripts/data/merged-plural-cards.json. FSRS of the singular is not touched.
//   npx tsx scripts/merge-plural-cards.ts          # dry run
//   npx tsx scripts/merge-plural-cards.ts --apply
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const PAIRS: [string, string][] = [
  ["4ba5fedf", "d30389f0"], ["f87f7231", "f8fd419c"], ["11a430f2", "c39b33d7"], ["e7fdc9d2", "b77a00e5"], ["306486cf", "20e6fb69"],
  ["f525bb89", "6c640b9d"], ["f30e6950", "35a4c4fa"], ["63104c81", "8de2ab08"], ["11aceee0", "e953ffd7"], ["103edda8", "6d40b1bb"],
  ["9f620112", "25e76392"], ["9d08b6ff", "dce06312"], ["07373d85", "54a8007a"], ["8db362c4", "89247da8"], ["1eb9e1fb", "21b10dc1"],
  ["cb26af68", "9c23964b"], ["3afcadfc", "747eee19"], ["48c2bee8", "d54d5c92"], ["257f1692", "a0d641ba"], ["c78c0fff", "29ee92f6"],
  ["0a918265", "c78f814d"], ["41bcfc7a", "e18978f9"], ["e522e4af", "e12df6e7"], ["fc22d87e", "0c17c923"], ["5d53be6f", "b246f680"], ["53cba76a", "a14c3629"],
];
const CLIP = ["recording_id", "audio_start_sec", "audio_end_sec", "clip_path"] as const;

(async () => {
  const cards: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("*").range(f, f + 999);
    if (error) throw error;
    cards.push(...data!);
    if (data!.length < 1000) break;
  }
  const find = (p: string) => { const h = cards.filter((c) => c.id.startsWith(p)); if (h.length !== 1) throw new Error(`${p}: ${h.length}`); return h[0]; };
  const backup: unknown[] = [];
  let merged = 0;
  for (const [sp, pp] of PAIRS) {
    const single = find(sp), plural = find(pp);
    const { data: srs, error } = await sb.from("card_srs").select("*").eq("card_id", plural.id);
    if (error) throw error;
    const { count } = await sb.from("review_log").select("id", { count: "exact", head: true }).in("card_srs_id", (srs ?? []).map((s) => s.id));
    if (count) { console.log("keep, has reviews:", plural.translit_nikud); continue; }
    if (!single.plural_form?.includes(plural.translit_nikud.replace(/\s/g, "")) && !single.plural_form) throw new Error(`no plural_form on ${single.translit_nikud}`);
    const moveClip = plural.clip_path && !single.clip_path;
    console.log(`${single.translit_nikud} ← ${plural.translit_nikud}${moveClip ? " (clip moves)" : plural.clip_path ? " (LOSES clip)" : ""}`);
    if (plural.clip_path && !moveClip) continue;
    backup.push({ card: plural, card_srs: srs, into: single.id });
    merged++;
    if (!APPLY) continue;
    if (moveClip) {
      const { error: e } = await sb.from("cards").update(Object.fromEntries(CLIP.map((k) => [k, plural[k]]))).eq("id", single.id);
      if (e) throw e;
    }
    const { error: e2 } = await sb.from("cards").delete().eq("id", plural.id);
    if (e2) throw e2;
  }
  console.log(`${merged} merged${APPLY ? "" : " (dry run)"}`);
  if (APPLY) writeFileSync("scripts/data/merged-plural-cards.json", JSON.stringify(backup, null, 1));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
