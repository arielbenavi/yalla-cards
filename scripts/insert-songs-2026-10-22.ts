// Ten songs from the "Aravit" playlist, 2026-10-22.
//
// Lyrics: the Arabic-script lines Ariel supplied (his lrclib search, kept only
// where the match was confident) — scripts/data/songs-2026-10-22/_lyrics.json.
// Repeated lines stay in, in order: the song is read along with the track.
//
// Everything else is chatifai's, two passes per song over the distinct lines:
//   1. a full pointed Hebrew transliteration of each line;
//   2. every word in order — Arabic, meaning, pointed Hebrew transliteration,
//      and the Palestinian form when the song's dialect says it differently.
// The Palestinian form goes on the word's `note` ("בפלסטינית: …"), per the
// 2026-08-07 ruling that a divergence is marked rather than smoothed over.
//
// One repair is mechanical, not linguistic: in some word entries chatifai typed
// Hebrew look-alike letters into the Arabic field (בפكر, جרוحي). Those take the
// Arabic from the matching token of the original line, by letter skeleton; a
// lone "ו" is the و prefix. Anything that cannot be matched is reported and the
// script refuses to write.
//
//   npx tsx scripts/insert-songs-2026-10-22.ts          # dry run
//   npx tsx scripts/insert-songs-2026-10-22.ts --apply
//   npx tsx scripts/backfill-song-covers.ts --apply      # then, for the covers
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const DIR = "scripts/data/songs-2026-10-22";

const YOUTUBE: Record<string, string> = {
  como_tu: "https://www.youtube.com/watch?v=LY71IfWHzf8",
  la: "https://www.youtube.com/watch?v=Q-6KnHFPL8Q",
  nasini: "https://www.youtube.com/watch?v=rBEuQUEyIRg",
  ya_ghayeb: "https://www.youtube.com/watch?v=QLgEc9jC24c",
  shako_mako: "https://www.youtube.com/watch?v=Ei-vXWYH6oc",
  ta3al: "https://www.youtube.com/watch?v=lQYN1KgXaM8",
  oul_tani: "https://www.youtube.com/watch?v=3ObVN3QQiZ8",
  hilwa: "https://www.youtube.com/watch?v=ZL2j6rOaCco",
  do_you_love_me: "https://www.youtube.com/watch?v=ubVfuinllEM",
  // The lyrics carry the Moroccan verse of the Delarue & Orio remix.
  ana_enta: "https://www.youtube.com/watch?v=IZtQDLfKYow",
};

type Song = { title: string; artist: string; dialect: string; raw: string; lines: string[]; uniq: string[] };
type ChatifaiWord = [ar: string, he: string, translit: string, pal: string];
type ChatifaiLine = [translit: string, words: ChatifaiWord[]];
type Word = { ar: string; he: string; translit: string; note?: string };

const HEB = /[א-ת]/;
const AR2HE: Record<string, string> = {
  ا: "א", أ: "א", إ: "א", آ: "א", ء: "א", ئ: "י", ؤ: "ו", ب: "ב", ت: "ת", ث: "ת", ج: "ג", ح: "ח", خ: "ח",
  د: "ד", ذ: "ד", ر: "ר", ز: "ז", س: "ס", ش: "ש", ص: "צ", ض: "צ", ط: "ט", ظ: "ט", ع: "ע", غ: "ע", ف: "פ",
  ق: "ק", ك: "כ", ل: "ל", م: "מ", ن: "נ", ه: "ה", ة: "ה", و: "ו", ي: "י", ى: "י", ڭ: "ג",
};
const FINAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
// A mixed string keeps its Arabic letters, so project both sides onto Hebrew.
// ק and כ are folded together: chatifai wrote הפקר for هفكر.
const skeleton = (s: string) =>
  [...s].map((c) => AR2HE[c] ?? FINAL[c] ?? c).filter((c) => HEB.test(c)).join("").replace(/[אוי]/g, "").replace(/ק/g, "כ");
const tokens = (line: string) =>
  line.replace(/\([^)]*\)/g, " ").replace(/[،,؟?!".:]/g, " ").split(/\s+/).filter(Boolean);
const fold = (s: string) => s.normalize("NFC").replace(/[֑-ׇ'׳\-\s()]/g, "");

function repairAr(ar: string, line: string, problems: string[], where: string): string {
  if (!HEB.test(ar)) return ar;
  if (ar.trim() === "ו") return "و";
  const sk = skeleton(ar);
  const hit = tokens(line).find((t) => skeleton(t) === sk) ?? tokens(line).find((t) => sk.length > 1 && skeleton(t).endsWith(sk));
  if (!hit) problems.push(`${where}: "${ar}" לא נמצא בשורה "${line}"`);
  return hit ?? ar;
}

async function main() {
  const lyrics: Record<string, Song> = JSON.parse(readFileSync(`${DIR}/_lyrics.json`, "utf8"));
  const { data: existing, error } = await sb.from("songs").select("title");
  if (error) throw error;
  const have = new Set((existing ?? []).map((s) => s.title));

  const rows: { title: string; artist: string; lyrics_raw: string; youtube_url: string; lyrics_parsed: unknown[] }[] = [];
  const problems: string[] = [];
  let repaired = 0;

  for (const [key, song] of Object.entries(lyrics)) {
    const cf: ChatifaiLine[] = JSON.parse(readFileSync(`${DIR}/${key}.json`, "utf8"));
    if (cf.length !== song.uniq.length) problems.push(`${key}: ${cf.length} שורות מ-chatifai מול ${song.uniq.length} ייחודיות`);

    const parsed = song.lines.map((line) => {
      const u = song.uniq.indexOf(line);
      const [translit, words] = cf[u] ?? ["", []];
      if (!translit) problems.push(`${key}: אין תעתיק לשורה "${line}"`);
      return {
        ar: line,
        line: translit,
        words: words.map(([ar, he, tr, pal], i): Word => {
          const fixed = repairAr(ar, line, problems, `${key} #${u + 1}.${i + 1}`);
          if (fixed !== ar) repaired++;
          const w: Word = { ar: fixed, he, translit: tr };
          if (pal && fold(pal) !== fold(tr)) w.note = `בפלסטינית: ${pal}`;
          return w;
        }),
      };
    });

    const words = parsed.reduce((n, l) => n + l.words.length, 0);
    const marked = parsed.reduce((n, l) => n + l.words.filter((w) => w.note).length, 0);
    console.log(`${have.has(song.title) ? "⏭ קיים" : "➕"} ${song.title} — ${song.artist} · ${song.dialect}`);
    console.log(`   ${parsed.length} שורות (${song.uniq.length} ייחודיות) · ${words} מילים · ${marked} עם צורה פלסטינית`);
    if (!have.has(song.title)) {
      rows.push({ title: song.title, artist: song.artist, lyrics_raw: song.raw, youtube_url: YOUTUBE[key], lyrics_parsed: parsed });
    }
  }

  console.log(`\n${repaired} מילים שהכתב הערבי שלהן שוחזר מהשורה המקורית`);
  if (problems.length) {
    console.error(`\n❌ ${problems.length} בעיות — לא נכתב כלום:`);
    for (const p of problems) console.error("   " + p);
    process.exit(1);
  }
  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }
  for (const r of rows) {
    const { error: e } = await sb.from("songs").insert(r);
    if (e) throw new Error(`${r.title}: ${e.message}`);
  }
  console.log(`\n✅ נוספו ${rows.length} שירים. עכשיו: npx tsx scripts/backfill-song-covers.ts --apply`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
