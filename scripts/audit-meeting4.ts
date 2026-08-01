// Audits the מפגש 4 cards against the printed book list (task #1).
//
// Matching strips nikud and the parenthesised article forms, and tries each
// slash-separated variant, because the book prints "לַחַדّ / לַ" as one entry
// while the DB may hold either.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { MEETING4_BOOKLIST } from "./data/meeting4-booklist";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const MEETING4 = "מפגש 4 - מילות יחס, שייכות ומספרים";

/** Strip nikud, geresh variants, article parentheses and spacing. */
function key(s: string): string {
  return s
    .normalize("NFC")
    // Hebrew nikud AND Arabic diacritics — the printed list mixes an Arabic
    // shadda (U+0651) into Hebrew words where the DB uses a Hebrew dagesh
    .replace(/[֑-ׇ]/g, "")
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[׳']/g, "'")
    .replace(/\(א\)|\(אל\)|\(ר\)/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function variants(s: string): string[] {
  return s.split("/").map((v) => key(v)).filter(Boolean);
}

async function main() {
  const { data: lessons } = await sb.from("lessons").select("id, title");
  const m4 = (lessons ?? []).find((l) => l.title === MEETING4);
  if (!m4) throw new Error("מפגש 4 lesson not found");

  const all: { id: string; translit_nikud: string; hebrew_meaning: string; lesson_id: string | null; chatifai_verified: boolean; plural_form: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb
      .from("cards")
      .select("id, translit_nikud, hebrew_meaning, lesson_id, chatifai_verified, plural_form")
      .range(from, from + 999);
    if (!data?.length) break;
    all.push(...(data as typeof all));
    if (data.length < 1000) break;
  }

  // Index every card by every normalised variant of its translit
  const byKey = new Map<string, (typeof all)[number][]>();
  for (const c of all) {
    for (const v of variants(c.translit_nikud)) {
      if (!byKey.has(v)) byKey.set(v, []);
      byKey.get(v)!.push(c);
    }
  }

  const missing: string[] = [];
  const wrongLesson: string[] = [];
  const unverified: string[] = [];
  const noPlural: string[] = [];
  let ok = 0;

  for (const e of MEETING4_BOOKLIST) {
    const hits = variants(e.translit).flatMap((v) => byKey.get(v) ?? []);
    if (hits.length === 0) {
      missing.push(`  ${String(e.n).padStart(2)}. ${e.translit.padEnd(18)} ${e.he}`);
      continue;
    }
    const inM4 = hits.find((h) => h.lesson_id === m4.id);
    const card = inM4 ?? hits[0];
    if (!inM4) {
      wrongLesson.push(`  ${String(e.n).padStart(2)}. ${e.translit.padEnd(18)} קיים אבל לא במפגש 4`);
    }
    if (!card.chatifai_verified) {
      unverified.push(`  ${String(e.n).padStart(2)}. ${e.translit.padEnd(18)} ${e.he}`);
    }
    if (e.plural && !card.plural_form) {
      noPlural.push(`  ${String(e.n).padStart(2)}. ${e.translit.padEnd(18)} חסר ריבוי: ${e.plural}`);
    }
    if (inM4 && card.chatifai_verified) ok++;
  }

  const m4Cards = all.filter((c) => c.lesson_id === m4.id);
  const bookKeys = new Set(MEETING4_BOOKLIST.flatMap((e) => variants(e.translit)));
  const extra = m4Cards.filter((c) => !variants(c.translit_nikud).some((v) => bookKeys.has(v)));

  console.log(`רשימת הספר: ${MEETING4_BOOKLIST.length} · כרטיסים במפגש 4: ${m4Cards.length}`);
  console.log(`תקינים (במפגש 4 + מאומתים): ${ok}\n`);

  const section = (title: string, lines: string[]) => {
    console.log(`${title} — ${lines.length}`);
    for (const l of lines) console.log(l);
    console.log();
  };

  section("❌ חסרים לגמרי", missing);
  section("⚠ קיימים אבל משויכים לשיעור אחר", wrongLesson);
  section("⚠ לא chatifai_verified", unverified);
  section("⚠ חסר ריבוי שהספר נותן", noPlural);

  console.log(`ℹ כרטיסים במפגש 4 שאינם ברשימת הספר — ${extra.length}`);
  for (const c of extra) console.log(`  ${c.translit_nikud} — ${c.hebrew_meaning}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
