// Reconciles the משימות tab with the session of 2026-10-21 (ע׳דא, צ'דא, the
// last chatifai blocker). Same rule as close-notes-2026-08-23.ts: close only what is done and
// checked; a note that is still partly blocked stays open with a comment.
//
//   npx tsx scripts/close-notes-2026-10-21.ts
//   npx tsx scripts/close-notes-2026-10-21.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

/** Keyed by id prefix — resolved to one open note each, or the script stops. */
const CLOSE: { id: string; why: string }[] = [
  { id: "b9a792c9", why: "chatifai: עַ'דַא / غداء = ארוחת צהריים. נכנס כרטיס." },
  { id: "6f0291ca", why: "נשאל chatifai: צַ'דַא / صدأ — בדיוק מה שכבר בכרטיס, אז אין מה לתקן. אם התכוונת לניקוד אחר, תכתוב אותו." },
  { id: "3c62169c", why: "כל מה שהיה חסום נעשה: ניקוד מפגש 6, בעפ 4, בעפ 5, נטייה מלאה ל-8 פעלים (כולל הבינוני של 'נולד' שתוקן ל-מַחְ'לוּק), ע׳דא וצ'דא." },
];

/** Still open — the note stays, the comment records what changed. */
const COMMENT: { id: string; note: string }[] = [];

async function main() {
  const { data: open, error } = await sb.from("notes").select("id, body").eq("status", "open");
  if (error) throw error;
  const resolve = (prefix: string) => {
    const hits = open!.filter((n) => n.id.startsWith(prefix));
    if (hits.length !== 1) throw new Error(`${prefix}: ${hits.length} פתקים פתוחים תואמים`);
    return hits[0];
  };
  const close = CLOSE.map((c) => ({ ...c, row: resolve(c.id) }));
  const comment = COMMENT.map((c) => ({ ...c, row: resolve(c.id) }));

  console.log(`=== לסגירה (${close.length}) ===`);
  for (const c of close) console.log(`• ${c.row.body.slice(0, 60)}`);
  console.log(`\n=== נשארים פתוחים עם עדכון (${comment.length}) ===`);
  for (const c of comment) console.log(`• ${c.row.body.slice(0, 60)}`);
  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }
  for (const c of close) {
    const { error: e } = await sb.from("notes").update({ status: "done", body: `${c.row.body}\n\n✅ 21.10.26: ${c.why}` }).eq("id", c.row.id);
    if (e) throw e;
  }
  for (const c of comment) {
    const { error: e } = await sb.from("notes").update({ body: `${c.row.body}\n\n${c.note}` }).eq("id", c.row.id);
    if (e) throw e;
  }
  console.log(`\n✅ ${close.length} נסגרו · ${comment.length} עודכנו`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
