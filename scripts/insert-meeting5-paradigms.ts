// The מפגש 5 paradigms — אִלִי / עִנְד / מַע, plus אַבּ/אַח' and the colours.
//
// These go into `paradigms` the same way meeting 3's did (migration 0017), so
// /inflections can serve them. Transcribed from the book pages, which are
// already pointed — the nikud is the book's, not composed here.
//
// The possession tables are the heart of מפגש 5, because the three words are not
// interchangeable and the difference is positional: a pronoun AFTER the noun
// means "this specific one is at/with/belongs to me", BEFORE the noun it means
// "I have". That rule is stored alongside the tables.
//
//   npx tsx scripts/insert-meeting5-paradigms.ts          # dry run
//   npx tsx scripts/insert-meeting5-paradigms.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ILI, IND, MAA, AB_AKH, POSSESSION_RULES, NOTES_GRAMMAR } from "./data/meeting5";
import { COLOURS, COLOURS_EXTRA } from "./data/meeting5-verified";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const MEETING = 5;

// The drill engine (app/api/inflection-drill/route.ts) only reads a TOP-LEVEL
// `rows` array whose entries have a `person` key — it makes one drill per other
// column. Nesting the three possession tables under `tables` would have made
// them silently undrillable, so each gets its own paradigm row, and the shared
// rule lives on all three rather than in a parent.
const SHARED_RULE = {
  words: POSSESSION_RULES.words,
  rule_after: POSSESSION_RULES.rule_after,
  rule_before: POSSESSION_RULES.rule_before,
  negation_before: POSSESSION_RULES.negation_before,
  negation_after: POSSESSION_RULES.negation_after,
  usage_notes: NOTES_GRAMMAR.filter((n) => /עִנְד|מַע|אִלִי|שלילה|מֵש|פִיש|חַדַא/.test(n)),
};

const PARADIGMS: { slug: string; data: Record<string, unknown> }[] = [
  {
    slug: "possession_ili",
    data: {
      description: "נטיית אִלִי (יש לי) בחיוב ובשלילה — שייכות (עמ' 68)",
      example_noun: "דַפְתַר",
      rows: ILI,
      ...SHARED_RULE,
    },
  },
  {
    slug: "possession_ind",
    data: {
      description: "נטיית עִנְד (יש ל.. / אצל) בחיוב ובשלילה — קניין (עמ' 69, 71)",
      example_noun: "סַיַّארַה",
      rows: IND,
      ...SHARED_RULE,
    },
  },
  {
    slug: "possession_maa",
    data: {
      description: "נטיית מַע (עמי, איתי, עלי) בחיוב ובשלילה — מה שעליי כרגע (עמ' 70)",
      example_noun: "רֵחְ'צַה",
      rows: MAA,
      ...SHARED_RULE,
    },
  },
  {
    slug: "ab_akh_inflection",
    data: {
      description: "נטיית אַבּ ו-אַח' על הבסיסים אַבּוּ- ו-אַח'וּ- (עמ' 72)",
      rows: AB_AKH,
      note: "באַבּוּה לא הוגים את ה-ה', פשוט מאריכים את ה-ו'",
    },
  },
  {
    slug: "colours",
    data: {
      description: "אִלְאַלְוַאן — הצבעים במשקל אַפְעַל / פַעְלַא / פֻעוּל (עמ' 73)",
      pattern: { m: "אַפְעַל", f: "פַעְלַא", pl: "פֻעוּל" },
      // `person` is what the engine keys a slot by. For colours the slot label
      // is the colour itself, so the drill reads "place אַחְמַר under אדום" —
      // one drill for masculine, one for feminine, one for plural. The Arabic
      // columns are named *_ar so the engine's SKIP_COLS leaves them out of the
      // drill while they stay available to the screen.
      rows: COLOURS.map((c) => ({
        person: c.he,
        m: c.translit,
        f: c.f,
        pl: c.pl,
        m_ar: c.ar,
        f_ar: c.f_ar,
        pl_ar: c.pl_ar,
      })),
      translations: { m: "זכר", f: "נקבה", pl: "רבים" },
      extra: COLOURS_EXTRA.map((c) => ({ he: c.he, translit: c.translit, ar: c.ar })),
      notes: NOTES_GRAMMAR.filter((n) => /צבע|אַסְמַר|ריבוי|פֻעוּל|ע' הפועל/.test(n)),
    },
  },
];

async function main() {
  for (const p of PARADIGMS) {
    const { data: existing } = await sb
      .from("paradigms")
      .select("id")
      .eq("meeting", MEETING)
      .eq("slug", p.slug)
      .maybeSingle();

    const rowCount =
      p.slug === "possession"
        ? Object.keys((p.data.tables as object) ?? {}).length + " טבלאות"
        : Array.isArray(p.data.rows)
          ? `${(p.data.rows as unknown[]).length} שורות`
          : "";
    console.log(`  ${existing ? "מעדכן" : "יוצר "}  מפגש ${MEETING} · ${p.slug}  ${rowCount}`);
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  for (const p of PARADIGMS) {
    // unique (meeting, slug) — upsert so a re-run corrects rather than duplicates
    const { error } = await sb
      .from("paradigms")
      .upsert({ meeting: MEETING, slug: p.slug, data: p.data }, { onConflict: "meeting,slug" });
    if (error) throw error;
    console.log(`✅ ${p.slug}`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
