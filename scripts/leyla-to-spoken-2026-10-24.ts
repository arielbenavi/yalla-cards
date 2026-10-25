// Ariel, 2026-10-24: Leyla's cards from literary to spoken, every form from chatifai
// (chat 6ada9c7bcab92323ed0bd261). Text only; review history stays on each card.
// What she wrote is kept in the notes.
// - אִלְאַאן (reviewed twice) becomes הַלְקֵית, and the הַלְקֵית card added an hour
//   earlier (never reviewed) is removed, so the history isn't lost.
// - אַיְצַ'ן is removed: כַּמַאן already has a card.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

const UPDATES: { from: string; tr: string; ar: string; he?: string }[] = [
  { from: "אַיְצַ'ן טַבַּחְ'תִ (א)לְעַ'דַאא", tr: "כַּמַאן טַבַּחְ'תִ (א)לְעַ'דַא", ar: "كمان طبخت الغدا" },
  { from: "וְאַנַא (א)לְאַאן פִי דַרְסְנַא", tr: "וְאַנַא הַלְקֵית פִי דַרְסְנַא", ar: "وأنا هلقيت في درسنا" },
  { from: "אַפַרְשִי אַסְנַאנִי", tr: "בַּפַרְשִי סְנַאנִי", ar: "بفرشي سناني" },
  { from: "בַּעְדִ (א)לְאִגְ'תִמַאע עִמִלְת לַנַפְסִי חֻ'בְּז מְחַמַּץ וּבֵּיצ' וּאַפוֹכַּאדוֹ וּאֻמִּי נַאדַתְנִי (א)לְאַאן", tr: "בַּעְדִ (א)לְאִגְ'תִמַאע עִמִלְת לַחַאלִי חֻ'בְּז מְחַמַּץ וּבֵּיצ' וּאַפוֹכַּאדוֹ וּאֻמִּי נַאדַתְנִי הַלְקֵית", ar: "بعد الاجتماع عملت لحالي خبز محمص وبيض وأفوكادو وأمي نادتني هلقيت" },
  { from: "אַלְעַבּ שַטַרַנְג'", tr: "בַּלְעַבּ שַטַרַנְג'", ar: "بلعب شطرنج" },
  { from: "אֻחִבִּּ (אל)סִּבַּאחַה", tr: "בַּחִבִּ (אל)סִּבַּאחַה", ar: "بحب السباحة" },
  { from: "נַחְנֻ (א)לְאַאן פִי פַצְלִ (אל)שִּתַאא וְהֻוֵּ בַּארֵד", tr: "אִחְנַא הַלְקֵית פִי פַצְלִ (אל)שִּתַא וְהֻוֵּ בַּארֵד", ar: "إحنا هلقيت في فصل الشتا وهو بارد" },
  { from: "אַנַא אֻפַצִּ'ל פַצְלִ (אל)צֵּיף", tr: "אַנַא בַּפַצִּ'ל פַצְלִ (אל)צֵּיף", ar: "أنا بفضل فصل الصيف" },
  { from: "אַיְצַ'ן בַּארֵד", tr: "כַּמַאן בַּארֵד", ar: "كمان بارد" },
  { from: "אַסְנַאן", tr: "סְנַאן", ar: "سنان" },
  { from: "אֻפַצִּ'ל", tr: "בַּפַצִּ'ל", ar: "بفضل" },
  { from: "לַנַפְסִי", tr: "לַחַאלִי", ar: "لحالي" },
  { from: "אִלְאַאן", tr: "הַלְקֵית", ar: "هلقيت", he: "עכשיו" },
];

(async () => {
  for (const u of UPDATES) {
    const { data: c } = await sb.from("cards").select("id, arabic_script").eq("translit_nikud", u.from).maybeSingle();
    if (!c) { console.log("✗ not found:", u.from); continue; }
    const patch: Record<string, string> = {
      translit_nikud: u.tr, arabic_script: u.ar,
      notes: `Preply · Leyla · מדובר (chatifai); היא כתבה: ${c.arabic_script}`,
    };
    if (u.he) patch.hebrew_meaning = u.he;
    const { error } = await sb.from("cards").update(patch).eq("id", c.id);
    if (error) throw error;
    console.log("✅", u.from, "→", u.tr);
  }
  for (const [tr, why] of [["אַיְצַ'ן", "כַּמַאן exists"], ["הַלְקֵית", "duplicate of the converted אִלְאַאן"]] as const) {
    // the newer, never-reviewed one
    const { data: rows } = await sb.from("cards").select("id, card_srs(reps)").eq("translit_nikud", tr === "הַלְקֵית" ? "הַלְקֵית" : tr).order("created_at", { ascending: false });
    const victim = (rows ?? []).find((r) => (r.card_srs as { reps: number }[]).every((s) => s.reps === 0) && (rows!.length > 1 || tr !== "הַלְקֵית"));
    if (!victim) { console.log("– nothing to remove for", tr); continue; }
    await sb.from("card_srs").delete().eq("card_id", victim.id);
    const { error } = await sb.from("cards").delete().eq("id", victim.id);
    if (error) throw error;
    console.log("🗑", tr, `(${why})`);
  }
})();
