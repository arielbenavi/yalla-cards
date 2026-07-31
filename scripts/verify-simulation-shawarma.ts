// Applies chatifai's line-by-line audit of simulation_shawarma and marks the row
// verified. See docs/simulation-audit.md for the full verdict.
//
// Only the lines chatifai actually ruled on are changed. Its "polished version"
// added and merged turns beyond what it was asked to review; those structural
// edits are not applied here, since the multiple-choice branch is what the note
// (a4e6b161) is about and chatifai marked that line correct.
//
//   npx tsx scripts/verify-simulation-shawarma.ts          # dry run
//   npx tsx scripts/verify-simulation-shawarma.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

type Cell = { translit?: string; ar?: string; he?: string };
type Turn = Cell & { speaker?: string; options?: Cell[] };

/** old translit → corrected cell, per chatifai's verdict */
const FIXES: { match: string; reason: string; to: Cell }[] = [
  {
    match: "אַהְלַן יַא עַמִּי, שׁוּ בִּדִּי אַטְעִימַכּ אִלְ-יוֹם?",
    reason:
      'chatifai: "מוכר לא אומר \'מה אני רוצה להאכיל אותך\'. זה נשמע כמו אמא שמדברת לילד קטן."',
    to: {
      translit: "אַהְלַן יַא עַמִּי, תְפַצַּ'ל, שׁוּ בִּדַּכּ?",
      ar: "أهلا يا عمي، تفضّل، شو بدك؟",
      he: "אהלן יא עמי, בבקשה, מה אתה רוצה?",
    },
  },
  {
    match: "בִּדִּי וַאחַד שׁוַארְמַא, בַּס בִּדִּי אִיַּאהַא בִּלְ-חֻ'בְּז אִלְ-עַאדִי.",
    reason:
      "gender error — סנדוויץ' is masculine, so אִיַּאה not אִיַּאהַא; chatifai also prefers סַנְדְוִיש over וַאחַד",
    to: {
      translit: "בִּדִּי סַנְדְוִיש שׁוַארְמַא, בַּס בִּדִּי אִיַּאה בִּחֻ'בְּז עַאדִי.",
      ar: "بدي سندويش شاورما، بس بدي إياه بخبز عادي.",
      he: "אני רוצה סנדוויץ' שווארמה, אבל בלחם רגיל.",
    },
  },
  {
    match: "לַחְמֵה, וּכְּתִיר אִלְ-טַחִינֵה.",
    reason: 'chatifai: "נשמע כמו רשימת מכולת. בדוכן אומרים \'תכביד את הטחינה\'."',
    to: {
      translit: "לַחְמֵה, וְכַּתִּ'רְלִי (אִל)טַּחִינֵה.",
      ar: "لحمة، وكثّرلي الطحينة.",
      he: "בשר, ותכביד לי את הטחינה.",
    },
  },
];

// ض is written צ׳ everywhere in the cards table; these dialogues drifted to ד׳.
const DAD_FIX = { from: "תְפַדַּ'ל", to: "תְפַצַּ'ל" };

async function main() {
  const { data: row, error } = await sb
    .from("paradigms")
    .select("id, data")
    .eq("slug", "simulation_shawarma")
    .single();
  if (error || !row) throw error ?? new Error("simulation_shawarma not found");

  const turns: Turn[] = structuredClone((row.data as { turns: Turn[] }).turns);
  const applied: string[] = [];

  for (const t of turns) {
    for (const cell of [t, ...(t.options ?? [])]) {
      if (!cell.translit) continue;

      for (const fix of FIXES) {
        if (cell.translit === fix.match) {
          applied.push(`  ${fix.match}\n    → ${fix.to.translit}\n    (${fix.reason})`);
          Object.assign(cell, fix.to);
        }
      }

      if (cell.translit.includes(DAD_FIX.from)) {
        const before = cell.translit;
        cell.translit = cell.translit.split(DAD_FIX.from).join(DAD_FIX.to);
        applied.push(`  ${before}\n    → ${cell.translit}\n    (ض is צ׳ in the cards table, not ד׳)`);
      }
    }
  }

  console.log(`simulation_shawarma — ${applied.length} change(s):\n`);
  for (const a of applied) console.log(a + "\n");

  if (!APPLY) {
    console.log("dry run — pass --apply to write");
    return;
  }

  const newData = {
    ...(row.data as object),
    turns,
    chatifai_verified: true,
    verified_at: new Date().toISOString().slice(0, 10),
    verification_note:
      "chatifai audited line by line. 8/11 lines passed clean; lines 1, 2 and 4 corrected. " +
      "It reviewed naturalness and the Hebrew transliteration only — the Arabic column was not checked.",
  };

  const { error: upErr } = await sb.from("paradigms").update({ data: newData }).eq("id", row.id);
  if (upErr) throw upErr;
  console.log("✅ written, marked chatifai_verified");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
