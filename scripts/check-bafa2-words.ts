import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const targets = [
  "ערבוב","תחביב","ביחד","באותו","לפני צבא","קבוצה","פירקה","פאריק","איזה",
  "רצית","לנצח","האמת","מכיוון","משחק","אני אגיד","הם מדברים","חשוב",
  "בנחת","כדורסל","אני אוהב","אחים","אתה אוהב","אכול",
  "עיז","הסתיים השיעור","רטוב","להתראות","הרטוב לא מפחד","תשלים",
  "קשה","קל","יפה","מצבי","דוד","דודה","חזרתי","לקחתי","חדשות",
  "ידיעה","איפה היית","חופשת","נכון","דמות","אישיות","שחקן",
  "האמת איתך","תכנית","סרט","עברית","דמיוני","בדיוני","אמיתי","מוכר","ידוע",
  "מת","לבן","העם","חושב","זמר","אף פעם","פעם ראשונה","לפחות","כבש","מהמם","משגע"
];

async function main() {
  const { data: cards } = await supabase
    .from("cards")
    .select("id, item_type, translit_nikud, hebrew_meaning, lesson_id")
    .order("created_at", { ascending: false });

  if (!cards) { console.error("no cards"); return; }

  const found: string[] = [];
  const notFound: string[] = [];

  for (const t of targets) {
    const match = cards.find(c => c.hebrew_meaning?.includes(t));
    if (match) found.push(`✓ "${t}" → ${match.translit_nikud} (lesson: ${match.lesson_id ?? "none"})`);
    else notFound.push(t);
  }

  console.log(`=== FOUND (${found.length}/${targets.length}) ===`);
  for (const f of found) console.log(" ", f);

  console.log(`\n=== NOT FOUND (${notFound.length}) ===`);
  for (const t of notFound) console.log(`  "${t}"`);

  // Cards under each relevant lesson
  for (const [name, lid] of [
    ["שיעור 2", "5325a7b7-82e9-446c-ac41-d913690d52dd"],
    ["מפגש בעפ 1", "b3e16d4f-af1f-4376-9e6e-f2bfc07524b4"],
    ["מפגש בעפ 2", "1ec690db-bde3-463b-9c27-888150347a75"],
  ] as const) {
    const lst = cards.filter(c => c.lesson_id === lid);
    console.log(`\n=== ${name} (${lst.length} cards) ===`);
    for (const c of lst) console.log(`  [${c.item_type}] ${c.translit_nikud} — ${c.hebrew_meaning}`);
  }
}

main();
