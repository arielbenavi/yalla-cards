import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { State } from "@/lib/fsrs";
import { config } from "@/lib/config";

export async function GET() {
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count: newDoneToday } = await supabase
    .from("review_log")
    .select("id", { count: "exact", head: true })
    .eq("state", State.New)
    .gte("reviewed_at", startOfDay.toISOString());

  const remainingNewAllowance = Math.max(0, config.newCardsPerDay - (newDoneToday ?? 0));

  const cardSelect =
    "id, direction, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, card:cards(id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, clip_path)";

  const { data: dueRows, error: dueError } = await supabase
    .from("card_srs")
    .select(cardSelect)
    .neq("state", State.New)
    .lte("due", now)
    .order("due", { ascending: true });

  if (dueError) return NextResponse.json({ error: dueError.message }, { status: 500 });

  const { data: newRows, error: newError } = await supabase
    .from("card_srs")
    .select(cardSelect)
    .eq("state", State.New)
    .lte("due", now)
    .order("due", { ascending: true })
    .limit(remainingNewAllowance);

  if (newError) return NextResponse.json({ error: newError.message }, { status: 500 });

  const rows = [...(dueRows ?? []), ...(newRows ?? [])];

  const withAudioUrl = await Promise.all(
    rows.map(async (row) => {
      const card = Array.isArray(row.card) ? row.card[0] : row.card;

      let audioUrl: string | null = null;
      if (card?.clip_path) {
        const { data } = await supabase.storage
          .from("recordings")
          .createSignedUrl(card.clip_path, 60 * 10);
        audioUrl = data?.signedUrl ?? null;
      }

      return {
        card_srs_id: row.id,
        direction: row.direction,
        card_id: card?.id,
        hebrew_meaning: card?.hebrew_meaning,
        translit_nikud: card?.translit_nikud,
        arabic_script: card?.arabic_script,
        item_type: card?.item_type,
        notes: card?.notes,
        audio_url: audioUrl,
      };
    })
  );

  return NextResponse.json({
    cards: withAudioUrl,
    remaining_due: dueRows?.length ?? 0,
    remaining_new: Math.min(remainingNewAllowance, newRows?.length ?? 0),
  });
}
