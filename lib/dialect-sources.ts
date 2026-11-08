// Outside sources of spoken Palestinian Arabic, shared by scripts/check-palestinian.ts and the player.
// Madrasa: Hebrew-letter nikud, searched by the Hebrew meaning. Wiktionary: the South Levantine section.
export const norm = (s: string) =>
  s.replace(/[ً-ْٰـ؟?]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
const text = (h: string) =>
  h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").split("\n").map((l) => l.trim()).filter(Boolean);

export type Entry = { he: string; ar: string; tr: string };

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

