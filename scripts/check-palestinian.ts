/**
 * Checks cards against outside sources of spoken Palestinian Arabic, separately from chatifai:
 *   - Madrasa's spoken-Arabic dictionary (milon.madrasafree.com), searched by the Hebrew meaning.
 *     Hebrew-letter nikud. Ronen says it is sometimes imprecise, so it is one voice, not the judge.
 *   - English Wiktionary, the "South Levantine Arabic" section of the Arabic headword (Palestinian/Jordanian).
 * A card "agrees" with a source when the source lists the same Arabic (marks and letter variants ignored).
 * Prints a report; --apply stores it in cards.dialect_check. Never changes the card text or FSRS state.
 *
 *   npx tsx scripts/check-palestinian.ts --lesson "<lesson title>" [--apply]
 *   npx tsx scripts/check-palestinian.ts --ids <id,id,...> [--apply]
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const APPLY = process.argv.includes("--apply");

export const norm = (s: string) =>
  s.replace(/[ً-ْٰـ؟?]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
const text = (h: string) =>
  h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").split("\n").map((l) => l.trim()).filter(Boolean);

type Entry = { he: string; ar: string; tr: string };

/** Exact-match entries from Madrasa for one Hebrew word or phrase. */
export async function madrasa(he: string): Promise<Entry[]> {
  const html = await (await fetch(`https://milon.madrasafree.com/default.asp?searchString=${encodeURIComponent(he)}`)).text();
  const l = text(html);
  const start = l.indexOf("בדיוק מה שחיפשתם."), end = l.indexOf("תוצאות אחרות", start + 1);
  if (start < 0) return [];
  const block = l.slice(start + 1, end > 0 ? end : undefined);
  const out: Entry[] = [];
  for (let i = 0; i < block.length; i++) {
    if (/[؀-ۿ]/.test(block[i]) && /[א-ת]/.test(block[i + 1] ?? "")) {
      let h = i - 1; while (h > 0 && /^(שם עצם|שם תואר|פועל|זכר|נקבה|יחיד|רבים|זוגי|בניין \d+|צורת הרבים|למילה המלאה|chevron_left)$/.test(block[h])) h--;
      out.push({ he: block[h], ar: block[i], tr: block[i + 1] });
      i++;
    }
  }
  return out;
}

/** The South Levantine section of the Wiktionary page for an Arabic word, if any. */
export async function wiktionary(ar: string): Promise<string | null> {
  const r = await fetch(`https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(norm(ar))}&action=raw`, { headers: { "User-Agent": "yalla-cards/1.0 (personal study app)" } });
  if (!r.ok) return null;
  const raw = await r.text();
  const m = raw.match(/==South Levantine Arabic==([\s\S]*?)(\n==[^=]|$)/);
  if (!m) return null;
  const defs = [...m[1].matchAll(/^# (.+)$/gm)].map((x) => x[1].replace(/\{\{[^}]*\}\}|\[\[|\]\]/g, "").trim()).filter(Boolean);
  const tr = m[1].match(/tr=([^|}]+)/)?.[1];
  return [tr && `(${tr})`, defs.join("; ")].filter(Boolean).join(" ") || "יש ערך";
}

async function main() {
  let q = sb.from("cards").select("id,arabic_script,translit_nikud,hebrew_meaning");
  if (arg("--ids")) q = q.in("id", arg("--ids")!.split(","));
  else if (arg("--lesson")) {
    const { data: l } = await sb.from("lessons").select("id").eq("title", arg("--lesson")!);
    q = q.in("lesson_id", (l ?? []).map((x) => x.id));
  } else throw new Error("--lesson or --ids");
  const { data: cards, error } = await q;
  if (error) throw error;
  for (const c of cards!) {
    const arParts = c.arabic_script.split("/").map((s: string) => s.trim());
    const heParts = c.hebrew_meaning.split(/[\/,;]/).map((s: string) => s.replace(/\(.*?\)/g, "").trim()).filter(Boolean);
    const m: Entry[] = [];
    for (const he of heParts) m.push(...(await madrasa(he)));
    const madrasaAgrees = m.some((e) => arParts.some((a: string) => norm(e.ar).split(/[،,]/).map((x) => x.trim()).includes(norm(a))));
    const w: Record<string, string | null> = {};
    for (const a of arParts) w[a] = await wiktionary(a);
    const check = {
      checked_at: new Date().toISOString(),
      madrasa: { agrees: m.length ? madrasaAgrees : null, entries: m },
      wiktionary_ajp: w,
    };
    const flag = !m.length ? "– madrasa: אין ערך" : madrasaAgrees ? "✓ madrasa" : "✗ madrasa";
    console.log(`\n${c.translit_nikud} · ${c.arabic_script} · ${c.hebrew_meaning}\n  ${flag}`);
    for (const e of m) console.log(`    ${e.he}: ${e.ar} ${e.tr}`);
    for (const [a, v] of Object.entries(w)) console.log(`  wiktionary ${a}: ${v ?? "אין ערך פלסטיני"}`);
    if (APPLY) {
      const { error: e } = await sb.from("cards").update({ dialect_check: check }).eq("id", c.id);
      if (e) throw e;
    }
  }
  if (!APPLY) console.log("\ndry run — add --apply to store in cards.dialect_check");
}
if (process.argv[1]?.includes("check-palestinian")) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
