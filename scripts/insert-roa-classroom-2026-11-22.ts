// Classroom phrases for talking to Roa (feminine forms) + "private teacher" words, 22.11.26.
// Feminine forms derived from MuFeed's verb stems (past/present); nikud is estimated until chatifai checks it.
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const NOTE = "ניקוד משוער: צורת נקבה שנגזרה מהבסיס במופיד";
const CARDS: [string, string, string, string?][] = [
  ["אִשְרַחִילִי", "תסבירי לי", "اشرحيلي", "בזכר: אִשְרַחְלִי. מופיד: שַׁרַח / יִשְׁרַח"],
  ["מֻמְכֵּן תִשְרַחִילִי?", "את יכולה להסביר לי?", "ممكن تشرحيلي؟"],
  ["רַגִּ'עִיהַא כַּמַאן מַרַּה", "תחזירי את זה עוד פעם", "رجّعيها كمان مرة", "מופיד: רַגַּע / יִרַגֵּע"],
  ["עִידִי כַּמַאן מַרַּה", "תגידי שוב, תחזרי על זה", "عيدي كمان مرة", "עאד לא נמצא במופיד, משוער יותר"],
  ["אִחְכִּי בְּשְוֵיש", "תדבר/י לאט", "احكي بشويش", "אִחְכִּי זהה בזכר ובנקבה. מופיד: חַכַּא / יִחְכִּי"],
  ["חֻ'דִי וַקְתִכּ", "קחי את הזמן", "خدي وقتك", "בזכר: חֻ'דּ וַקְתַכּ. מופיד: אַחַ'ד / יַאחֹ'ד"],
  ["שוּ קַצְדִכּ?", "מה הכוונה שלך? (לאישה)", "شو قصدك؟"],
  ["כִּיף בִּתְקוּלִי ...?", "איך את אומרת ...?", "كيف بتقولي ...؟", "על עצמי: כִּיף בַּקוּל?"],
  ["בִּתִפְהַמִינִי?", "את מבינה אותי?", "بتفهميني؟", "מופיד: פִהֵם / יִפְהַם"],
  ["שוּ רַאיִכּ?", "מה דעתך? (לאישה)", "شو رأيك؟", "ברבים: שוּ רַאיְכּוֹן"],
  ["בִּתִתְדַ'כַּרִי?", "את זוכרת?", "بتتذكّري؟", "מופיד: תְדַ'כַּר / יִתְדַ'כַּר"],
  ["לַו סַמַחְתִי", "אם תרשי לי, בבקשה (לאישה)", "لو سمحتي", "מופיד, לזכר: לַו סַמַחְת"],
  ["בֵּינִי וּבֵּינִכּ", "ביני לבינך (לאישה)", "بيني وبينك"],
  ["כַּלַאמִכּ מֵש וַאצְ'ח", "הדברים שלך לא ברורים (לאישה)", "كلامك مش واضح"],
  ["מְעַלֵּם / מְעַלְּמֵה", "מורה / מורה (נקבה); גם הבוס", "معلّم / معلّمة", "מופיד: מְעַלֵּם, רבים מְעַלְּמִין. הנקבה משוערת"],
  ["אֻסְתַאד' / אֻסְתַאד'ֵה", "מורה, מר, פרופסור (זכר / נקבה)", "أستاذ / أستاذة", "מופיד: אֻסְתַאד', רבים אַסַאתִדֵ'ה. הנקבה משוערת"],
  ["חֻ'צוּצִי / חֻ'צוּצִיֵּה", "פרטי / פרטית", "خصوصي / خصوصيّة", "לא במופיד, משוער"],
  ["מְעַלְּמֵה חֻ'צוּצִיֵּה", "מורה פרטית", "معلّمة خصوصيّة"],
  ["דַרְס חֻ'צוּצִי", "שיעור פרטי", "درس خصوصي"],
];
const nt = (s: string) => (s ?? "").normalize("NFD").replace(/[֑-ׇ'׳"?!.,()\s–-]/g, "").replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");
(async () => {
  const all: { translit_nikud: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data, error } = await sb.from("cards").select("translit_nikud").range(f, f + 999); if (error) throw error; all.push(...data!); if (data!.length < 1000) break; }
  const have = new Set(all.map((c) => nt(c.translit_nikud)));
  const fresh = CARDS.filter(([tr]) => { const dup = have.has(nt(tr)); if (dup) console.log("skip (exists)", tr); return !dup; });
  console.log(`new ${fresh.length} of ${CARDS.length}`);
  if (!APPLY) return;
  let { data: l } = await sb.from("lessons").select("id").eq("title", "Preply Roa K. 5").maybeSingle();
  if (!l) { const r = await sb.from("lessons").insert({ title: "Preply Roa K. 5", source: "preply", meeting: 5, date: "2026-11-22" }).select("id").single(); if (r.error) throw r.error; l = r.data; }
  for (const [tr, he, ar, extra] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, hebrew_meaning: he, arabic_script: ar, notes: extra ? `${extra}. ${NOTE}` : NOTE, item_type: tr.includes(" ") && !tr.includes(" / ") ? "phrase" : "word", lesson_id: l!.id, chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  console.log("✅ done");
})();
