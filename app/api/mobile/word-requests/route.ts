import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Words tapped on a card and sent to "get me its translation", possibly offline.
// Each one is an open note, so it shows up in /notes and at session start, and
// becomes a card only in a regular pass with the rest of the new cards.
//
// Sent twice (a retry after a lost response): a word already open is skipped.
const TAG = "מילה לתרגום";

type Incoming = { word: string; arabic: string | null; card_id: string; sentence: string; meaning: string };

const headline = (i: Incoming) => `להביא תרגום: ${i.word}${i.arabic ? ` (${i.arabic})` : ""}`;

export async function POST(request: NextRequest) {
  const { items } = (await request.json()) as { items?: Incoming[] };
  const valid = (items ?? []).filter((i) => i.word?.trim() && i.word.length <= 80);
  if (!valid.length) return NextResponse.json({ added: 0, duplicates: 0 });

  const supabase = supabaseAdmin();
  const { data: open, error } = await supabase.from("notes").select("body").eq("status", "open").eq("tag", TAG);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const known = new Set((open ?? []).map((n) => (n.body as string).split("\n")[0]));
  const rows: { body: string; tag: string }[] = [];
  for (const i of valid) {
    const first = headline(i);
    if (known.has(first)) continue;
    known.add(first);
    rows.push({ body: `${first}\nמתוך: ${i.sentence} = ${i.meaning}\nכרטיס: ${i.card_id}`, tag: TAG });
  }
  if (rows.length) {
    const { error: insertError } = await supabase.from("notes").insert(rows);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ added: rows.length, duplicates: valid.length - rows.length });
}
