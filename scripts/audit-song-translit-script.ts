// Note efbd5595: "כמו בשיר immer, שיש ערבית ועברית ככה יפה, חוץ מהעובדה שאין
// תעתיק כמו ב yama … הכי חשוב תעתיק ותרגום, ואחכ בערבית. לא צריך אנגלית!!"
//
// Immer's words do carry a `translit` — in Latin ("wakha", "l-hbal"). Ariel
// reads Hebrew transliteration; a Latin one is not a transliteration he can
// use, which is why the song looked to him like it had none.
//
//   npx tsx scripts/audit-song-translit-script.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const HEBREW = /[֐-׿]/;
const LATIN = /[A-Za-z]/;
const ARABIC = /[؀-ۿ]/;

async function main() {
  const { data, error } = await sb.from("songs").select("id,title,artist,lyrics_parsed,lyrics_raw");
  if (error) throw error;

  console.log("שיר                       שורות  תעתיק-עברי  תעתיק-לטיני  ערבית-בתעתיק  בלי-תעתיק  בלי-תרגום");
  for (const s of data!) {
    const lines: any[] = Array.isArray(s.lyrics_parsed) ? s.lyrics_parsed : [];
    const words = lines.flatMap((l) => l.words ?? []);
    const heb = words.filter((w: any) => HEBREW.test(w.translit ?? "")).length;
    const lat = words.filter((w: any) => LATIN.test(w.translit ?? "") && !HEBREW.test(w.translit ?? "")).length;
    const arb = words.filter((w: any) => ARABIC.test(w.translit ?? "")).length;
    const none = words.filter((w: any) => !(w.translit ?? "").trim()).length;
    const noGloss = words.filter((w: any) => !(w.he ?? "").trim()).length;
    const flag = lines.length === 0 ? "  ⛔ אין ניתוח כלל" : lat > 0 ? "  ← לטיני" : "";
    console.log(
      `${s.title.padEnd(24)} ${String(lines.length).padStart(5)} ${String(heb).padStart(10)} ` +
        `${String(lat).padStart(12)} ${String(arb).padStart(13)} ${String(none).padStart(10)} ${String(noGloss).padStart(10)}${flag}`
    );
  }

  const needsWork = data!.filter((s) => {
    const lines: any[] = Array.isArray(s.lyrics_parsed) ? s.lyrics_parsed : [];
    if (!lines.length) return true;
    const words = lines.flatMap((l) => l.words ?? []);
    return words.some((w: any) => !HEBREW.test(w.translit ?? ""));
  });
  console.log(`\nשירים שצריכים תעתיק עברי: ${needsWork.length}`);
  for (const s of needsWork) console.log(`   ${s.title} — ${s.artist}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
