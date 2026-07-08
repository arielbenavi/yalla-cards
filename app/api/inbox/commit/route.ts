import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type CommitRow = {
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: "word" | "phrase" | "sentence";
};

export async function POST(request: NextRequest) {
  const { rows, lesson_id } = (await request.json()) as {
    rows: CommitRow[];
    lesson_id: string | null;
  };

  if (!rows?.length) {
    return NextResponse.json({ error: "no rows" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .insert(
      rows.map((row) => ({
        lesson_id: lesson_id || null,
        hebrew_meaning: row.hebrew_meaning,
        translit_nikud: row.translit_nikud,
        item_type: row.item_type,
      }))
    )
    .select();

  if (cardsError) return NextResponse.json({ error: cardsError.message }, { status: 500 });

  const { error: srsError } = await supabase
    .from("card_srs")
    .insert(cards.map((card) => ({ card_id: card.id, direction: "he_to_ar" })));

  if (srsError) return NextResponse.json({ error: srsError.message }, { status: 500 });

  return NextResponse.json({ cards });
}
