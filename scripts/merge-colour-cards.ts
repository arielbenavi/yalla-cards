// Merges the three-forms-per-colour cards into one (note 375cf9df).
//
// "בצבעים לאחד כרטיסיות, לא 3 כרטיסיות עם מילים נפרדות לאותו צבע, שיהיה לדוגמה
// אפור ואז מהצד השני ה3 תרגומים."
//
// The colours were seeded as one card per gender/number, so אדום was three
// separate reviews of the same fact. Merged: Hebrew colour on the front, all
// three Arabic forms on the back.
//
// **The survivor is the card with the most review history**, not the masculine
// one, so the merge keeps the strongest FSRS state rather than resetting to
// whichever form happened to be listed first. Everything dropped is written to a
// backup file first — this deletes cards that have been reviewed, and that is not
// undoable from the database alone.
//
//   npx tsx scripts/merge-colour-cards.ts          # dry run
//   npx tsx scripts/merge-colour-cards.ts --apply
import { config } from "dotenv";
import { writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

type Card = {
  id: string;
  translit_nikud: string;
  arabic_script: string | null;
  hebrew_meaning: string;
  notes: string | null;
  lesson_id: string | null;
};

const ORDER = { "ז": 0, "נ": 1, "ר": 2 } as const;

async function all<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  const cards = await all<Card>("cards", "id, translit_nikud, arabic_script, hebrew_meaning, notes, lesson_id");
  const srs = await all<{ id: string; card_id: string; reps: number }>("card_srs", "id, card_id, reps");
  const logs = await all<{ card_srs_id: string }>("review_log", "card_srs_id");

  const reviewsBySrs = new Map<string, number>();
  for (const l of logs) reviewsBySrs.set(l.card_srs_id, (reviewsBySrs.get(l.card_srs_id) ?? 0) + 1);
  const reviewsByCard = new Map<string, number>();
  for (const s of srs) {
    reviewsByCard.set(s.card_id, (reviewsByCard.get(s.card_id) ?? 0) + (reviewsBySrs.get(s.id) ?? 0));
  }

  const byBase = new Map<string, (Card & { form: "ז" | "נ" | "ר" })[]>();
  for (const c of cards) {
    const m = (c.hebrew_meaning ?? "").match(/^(.+?)\s*\((נ|ר)\)$/);
    const base = (m ? m[1] : c.hebrew_meaning ?? "").trim();
    const form = (m ? m[2] : "ז") as "ז" | "נ" | "ר";
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push({ ...c, form });
  }

  const groups = [...byBase.entries()].filter(
    ([, v]) => v.length >= 3 && v.some((x) => x.form === "נ") && v.some((x) => x.form === "ר")
  );

  const plan: { base: string; keep: Card; drop: Card[]; translit: string; arabic: string; blocked?: string }[] = [];

  for (const [base, list] of groups) {
    const masc = list.filter((x) => x.form === "ז");
    // More than one masculine means a duplicate that predates this merge. Merging
    // would silently pick one and delete the other, which is a different decision
    // than the one this script is for.
    if (masc.length > 1) {
      plan.push({
        base,
        keep: masc[0],
        drop: [],
        translit: "",
        arabic: "",
        blocked: `${masc.length} צורות זכר: ${masc.map((m) => m.translit_nikud).join(" / ")} — כפילות שקדמה למיזוג`,
      });
      continue;
    }

    const sorted = [...list].sort((a, b) => ORDER[a.form] - ORDER[b.form]);
    const translit = sorted.map((c) => c.translit_nikud).join(" · ");
    const arabic = sorted.map((c) => c.arabic_script ?? "").filter(Boolean).join(" · ");

    // Most-reviewed wins so the merge keeps the strongest FSRS state. When
    // nothing has been reviewed the choice is arbitrary, and an arbitrary pick
    // leaves the card fronted by a feminine or plural form — so ties fall back to
    // the masculine, which is the citation form.
    const keep = [...list].sort((a, b) => {
      const d = (reviewsByCard.get(b.id) ?? 0) - (reviewsByCard.get(a.id) ?? 0);
      return d !== 0 ? d : ORDER[a.form] - ORDER[b.form];
    })[0];
    plan.push({ base, keep, drop: list.filter((c) => c.id !== keep.id), translit, arabic });
  }

  console.log(`${groups.length} צבעים · ${plan.filter((p) => !p.blocked).length} ימוזגו\n`);
  for (const p of plan) {
    if (p.blocked) {
      console.log(`  ⏸ ${p.base} — ${p.blocked}`);
      continue;
    }
    const reviews = p.drop.reduce((n, c) => n + (reviewsByCard.get(c.id) ?? 0), 0);
    console.log(`  ${p.base}: ${p.translit}`);
    console.log(`      נשמר ${p.keep.translit_nikud} (${reviewsByCard.get(p.keep.id) ?? 0} חזרות) · נמחקים ${p.drop.length} (${reviews} חזרות)`);
  }

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  mkdirSync("backups", { recursive: true });
  const path = `backups/colours-${Date.now()}.json`;
  writeFileSync(path, JSON.stringify(plan.filter((p) => !p.blocked), null, 2));
  console.log(`\nגיבוי: ${path}`);

  for (const p of plan) {
    if (p.blocked) continue;
    const { error } = await sb
      .from("cards")
      .update({
        translit_nikud: p.translit,
        arabic_script: p.arabic || null,
        hebrew_meaning: `${p.base} (ז · נ · ר)`,
        notes: [p.keep.notes, "שלוש הצורות על כרטיס אחד: זכר · נקבה · רבים"]
          .filter(Boolean)
          .join(" · "),
      })
      .eq("id", p.keep.id);
    if (error) throw error;

    for (const d of p.drop) {
      const { error: e } = await sb.from("cards").delete().eq("id", d.id);
      if (e) throw e;
    }
  }
  console.log(`✅ מוזגו ${plan.filter((p) => !p.blocked).length} צבעים`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
