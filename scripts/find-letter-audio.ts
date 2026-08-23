// Note 28e16a9b: "בפיצ'ר הגייה שיש עם האותיות המתסבכות, להצמיד מההקלטות
// הראשונות בווצאפ בקבוצה איך הוגים, שיהיה כפתור רמקול, לדוגמה ל-צ' וכו'."
//
// The מפגש 1 recordings walk the alphabet letter by letter and the transcript
// carries word-level timestamps, so the moment each letter is taught can be
// located rather than guessed. This script only *reports* candidates — the
// window it proposes is a guess about where an explanation ends, and a wrong
// window plays the wrong sound, which is worse for a pronunciation button than
// no sound at all. What gets stored is chosen in scripts/data/letter-audio.ts.
//
//   npx tsx scripts/find-letter-audio.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { LETTERS } from "../lib/arabic-letters";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Word = { word: string; start: number; end: number };

/** Whisper writes the geresh inconsistently (׳ ' ’) and glues punctuation on. */
const norm = (s: string) =>
  s.normalize("NFC").replace(/[׳'’`]/g, "'").replace(/[.,!?;:״"]/g, "").trim();

async function main() {
  const { data: recs, error } = await sb
    .from("recordings")
    .select("id, title, transcript_json, duration_sec")
    .order("created_at", { ascending: true });
  if (error) throw error;

  // The alphabet lessons only. Scanning all 63 recordings finds "עין" and "פא"
  // inside ordinary sentences all over the corpus.
  const alphabet = (recs ?? []).filter((r) =>
    /האותיות|האות |אותיות שמש|תנועות ארוכות|שַׁדָּה|הדגש/.test(r.title ?? "")
  );
  console.log(`הקלטות אלפבית: ${alphabet.length}`);
  for (const r of alphabet) console.log(`   ${r.title} (${Math.round(r.duration_sec)}s)`);
  console.log();

  for (const letter of LETTERS) {
    const name = norm(letter.name);
    const hits: string[] = [];

    for (const r of alphabet) {
      const words: Word[] = ((r.transcript_json as any)?.words ?? []).map((w: any) => ({
        word: norm(w.word ?? ""),
        start: w.start,
        end: w.end,
      }));

      words.forEach((w, i) => {
        if (w.word !== name) return;
        const context = words.slice(Math.max(0, i - 4), i + 14).map((x) => x.word).join(" ");
        hits.push(
          `      ${String(r.title).slice(0, 40).padEnd(42)} ${w.start.toFixed(1)}s  …${context}…`
        );
      });
    }

    console.log(`${letter.ch}  ${letter.name.padEnd(8)} ${letter.sound.padEnd(16)} ${hits.length} אזכורים`);
    for (const h of hits.slice(0, 3)) console.log(h);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
