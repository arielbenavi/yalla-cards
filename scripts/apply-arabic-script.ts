// Fills arabic_script on the cards whose Arabic the book never supplied.
//
// The pass that produced these asked chatifai for the ARABIC SCRIPT ONLY. The
// word, its pointing and its meaning all came from the course and are untouched
// here — the only field written is `arabic_script`, and only where it is empty.
//
// `chatifai_verified` is deliberately NOT set. The pointing on these cards came
// from the book, not from chatifai; claiming chatifai verified the card would
// overstate what it was actually asked.
//
//   npx tsx scripts/apply-arabic-script.ts
//   npx tsx scripts/apply-arabic-script.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

// chatifai's answers, kept in the repo so the run is reproducible and so the
// exact strings that were written are auditable.
const RESULTS = "scripts/data/arabic-results.txt";

type Job = { id: string; translit: string; he: string; lesson: string; type: string };

const ARABIC = /[؀-ۿ]/;
const HEBREW = /[֐-׿]/;

/**
 * Cards where chatifai's Arabic is worth a second look. The value is stored as
 * it came back — rewriting it would be writing Arabic from general knowledge,
 * which is the one thing this project does not do — and the doubt goes on the
 * card so it is visible instead of buried.
 */
const FLAGGED: Record<number, string> = {
  25: "שדה התעתיק בכרטיס הזה מכיל גם פירוש בעברית (\u0022= זה הילד; ... = זאת הבת\u0022), ולא רק תעתיק. הערבית נכונה; הכרטיס עצמו צריך ניקוי.",
  187: "הפירוש הרשום על הכרטיס הוא \u0022התחיל\u0022, אבל بدي פירושו \u0022אני רוצה\u0022. הערבית נכונה — הפירוש הוא שנראה שגוי. לבדוק מול דרור.",
};

/**
 * Items whose Arabic is faithful to the stored transliteration and therefore
 * *wrong*, because the transliteration itself is corrupt. chatifai copied what
 * it was given instead of normalising, which is exactly what it was asked to
 * do — the defect is upstream, in Ariel's card.
 *
 * These are held rather than written. An empty arabic_script says "not known
 * yet"; a non-word says "this is the Arabic", and that is worse than a gap.
 * The transliteration has to be fixed first, then the Arabic re-asked.
 */
const HOLD_CORRUPT_SOURCE: Record<number, string> = {
  50: "اقصتك אינה מילה — התעתיק אִקְצַתַכ משובש. הצורה המקובלת: قصتك",
  82: "سيعة אינה מילה — התעתיק סֵיעַה משובש. שעה היא ساعة",
  91: "سيعرتي אינה מילה — התעתיק סֵיעַרְתִי משובש. \u0022המכונית שלי\u0022 היא سيارتي",
  124: "كستك אינה מילה — התעתיק כֻּסְתַכּ משובש. הצורה המקובלת: قصتك",
  129: "الحار = \u0022החם\u0022, לא \u0022השכונה\u0022. התעתיק (א)לְחַאר קטוע — צריך الحارة",
};

/**
 * Catches the failure mode that matters on a sentence pass: chatifai quietly
 * rewording a course sentence instead of just transliterating it into Arabic
 * script. A reworded sentence still looks like plausible Arabic, so nothing
 * downstream would notice — but the word count almost always drifts.
 *
 * Compared loosely on purpose. The transliteration writes the article as a
 * bracketed prefix — "(א)לְבַּנְדוֹרַה" is one token and "البندورة" is one token —
 * but clitics and the `يا` vocative can legitimately split or merge, so only a
 * real gap is reported.
 */
function wordCountDrift(translit: string, ar: string): number | null {
  const count = (x: string) => x.split(/[\s،,.!?؟]+/).filter((t) => /[^\s\-–—/()]/.test(t)).length;
  const a = count(translit);
  const b = count(ar);
  if (a < 3) return null; // single words and two-word phrases are not informative
  const tolerance = Math.max(1, Math.round(a * 0.25));
  return Math.abs(a - b) > tolerance ? b - a : null;
}

/**
 * The book lists two spellings of one word (וַחְדֵה / וַחְדַה) that Arabic does
 * not distinguish, so both alternants came back identical. Storing "وحدة / وحدة"
 * would show the learner a difference that is not there.
 */
function collapseIdenticalAlternants(ar: string): string {
  const parts = ar.split("/").map((x) => x.trim()).filter(Boolean);
  if (parts.length > 1 && new Set(parts).size === 1) return parts[0];
  return ar;
}

async function main() {
  const jobs: Job[] = JSON.parse(readFileSync("scripts/data/arabic-worklist.json", "utf-8"));

  const answers = new Map<number, string>();
  for (const raw of readFileSync(RESULTS, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || !line.includes("|")) continue;
    const [numPart, ...rest] = line.split("|");
    const num = Number(numPart.trim());
    if (!Number.isInteger(num)) continue;
    answers.set(num, rest.join("|").trim());
  }

  const updates: { id: string; translit: string; he: string; ar: string; flag?: string }[] = [];
  const unresolved: string[] = [];
  const rejected: string[] = [];

  const collapsed: string[] = [];
  const held: string[] = [];
  jobs.forEach((job, i) => {
    const num = i + 1;
    const raw = answers.get(num);
    if (!raw || raw === "?") { unresolved.push(`${num}. ${job.translit} — ${job.he}`); return; }
    if (HOLD_CORRUPT_SOURCE[num]) {
      held.push(`${num}. ${job.translit} (${job.he})\n     ${HOLD_CORRUPT_SOURCE[num]}`);
      return;
    }
    const ar = collapseIdenticalAlternants(raw);
    if (ar !== raw) collapsed.push(`${num}. ${job.translit}: "${raw}" → "${ar}"`);

    // Guards. The one thing that must not happen is Hebrew landing in the
    // Arabic column — that defect has got through on this project before
    // (سوولنا was stored with Hebrew in every ar slot).
    if (!ARABIC.test(ar)) { rejected.push(`${num}. ${job.translit}: אין ערבית בתשובה — "${ar}"`); return; }
    if (HEBREW.test(ar)) { rejected.push(`${num}. ${job.translit}: עברית בשדה הערבי — "${ar}"`); return; }

    // Known-benign length differences: one written word that Arabic conventionally
    // splits (إن شاء الله) or a source card whose transliteration field carries a
    // Hebrew gloss. Both trip the counter without being rewrites.
    const BENIGN_DRIFT = new Set([25, 166]);
    const drift = BENIGN_DRIFT.has(num) ? null : wordCountDrift(job.translit, ar);
    const driftFlag =
      drift === null
        ? null
        : `אורך שונה מהותית מהתעתיק (${drift > 0 ? "+" : ""}${drift} מילים) — ייתכן ש-chatifai ניסח מחדש במקום לתעתק. לבדוק.`;
    updates.push({
      id: job.id,
      translit: job.translit,
      he: job.he,
      ar,
      flag: [FLAGGED[num], driftFlag].filter(Boolean).join(" · ") || undefined,
    });
  });

  // Never overwrite. A card that gained Arabic since the worklist was built is
  // left alone rather than silently replaced.
  const ids = updates.map((u) => u.id);
  const current = new Map<string, string | null>();
  for (let from = 0; from < ids.length; from += 200) {
    const { data, error } = await sb
      .from("cards")
      .select("id, arabic_script")
      .in("id", ids.slice(from, from + 200));
    if (error) throw error;
    for (const c of data ?? []) current.set(c.id, c.arabic_script);
  }
  const skipped: string[] = [];
  const toWrite = updates.filter((u) => {
    const existing = current.get(u.id);
    if (existing?.trim()) { skipped.push(`${u.translit}: כבר יש ערבית — "${existing}"`); return false; }
    return true;
  });

  console.log(
    `${jobs.length} בעבודה · ${answers.size} תשובות · ${toWrite.length} לכתיבה · ` +
      `${unresolved.length} לא נפתרו · ${rejected.length} נפסלו · ${skipped.length} כבר עם ערבית\n`
  );
  for (const u of toWrite.slice(0, 20)) console.log(`  ${u.translit.padEnd(30)} → ${u.ar}`);
  if (toWrite.length > 20) console.log(`  … ועוד ${toWrite.length - 20}`);

  if (held.length) {
    console.log("\n⛔ מוחזקים — התעתיק במקור משובש, והערבית הנאמנה לו תהיה לא-מילה:");
    for (const h of held) console.log(`   ${h}`);
  }
  if (collapsed.length) {
    console.log("\n🔁 חלופות זהות אוחדו:");
    for (const c of collapsed) console.log(`   ${c}`);
  }
  const flagged = toWrite.filter((u) => u.flag);
  if (flagged.length) {
    console.log("\n⚠ מסומנים לבדיקה מול דרור:");
    for (const f of flagged) console.log(`   ${f.translit} → ${f.ar}\n     ${f.flag}`);
  }
  if (rejected.length) {
    console.log("\n⛔ נפסלו:");
    for (const r of rejected) console.log(`   ${r}`);
  }
  if (unresolved.length) {
    console.log("\n⏸ בלי תשובה:");
    for (const u of unresolved) console.log(`   ${u}`);
  }
  if (skipped.length) {
    console.log("\n⏭ דילוג — כבר יש ערבית:");
    for (const s of skipped) console.log(`   ${s}`);
  }

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const u of toWrite) {
    const { data: card } = await sb.from("cards").select("course_note").eq("id", u.id).single();
    const { error } = await sb
      .from("cards")
      .update({
        arabic_script: u.ar,
        course_note: [
          card?.course_note,
          "כתב ערבי מ-chatifai (הספר לא נותן ערבית)",
          u.flag ? `⚠ ${u.flag}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })
      .eq("id", u.id);
    if (error) throw error;
  }

  console.log(`\n✅ נכתב כתב ערבי ל-${toWrite.length} כרטיסים`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
