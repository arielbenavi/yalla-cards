import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Rating, State } from "@/lib/fsrs";
import { config } from "@/lib/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modeAll = searchParams.get("mode") === "all";
  const modeSelected = searchParams.get("mode") === "selected";
  const idsParam = searchParams.get("ids") ?? "";

  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  const cardSelect =
    "id, direction, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, card:cards(id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes, clip_path, lesson_id, audio_start_sec, audio_end_sec)";

  // PostgREST returns at most 1000 rows per request. card_srs is at ~974 and
  // growing, so these reads are about to start truncating silently. Paging
  // changes no behaviour today — it keeps each query returning everything it
  // already intends to return.
  //
  // The new-card query is the one that would break worst: it fetches `due ASC`
  // and then re-ranks newest-lesson-first in memory, so a cap would drop the
  // newest lessons — precisely the cards that ranking exists to surface —
  // before the ranking ever ran.
  type Paged<T> = { data: T[] | null; error: { message: string } | null };
  async function fetchAll<T>(
    build: () => { range: (a: number, b: number) => PromiseLike<Paged<T>> }
  ): Promise<Paged<T>> {
    const out: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await build().range(from, from + 999);
      if (error) return { data: null, error };
      if (!data?.length) break;
      out.push(...data);
      if (data.length < 1000) break;
    }
    return { data: out, error: null };
  }

  let rows;

  if (modeSelected && idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    const { data, error } = await supabase
      .from("card_srs")
      .select(cardSelect)
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Shuffle so the user doesn't study in browse-list order
    const shuffled = (data ?? []).slice().sort(() => Math.random() - 0.5);
    rows = shuffled;
  } else if (modeAll) {
    const { data, error } = await fetchAll(() =>
      supabase.from("card_srs").select(cardSelect).order("due", { ascending: true })
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).slice().sort(() => Math.random() - 0.5);
  } else {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: newDoneToday } = await supabase
      .from("review_log")
      .select("id", { count: "exact", head: true })
      .eq("state", State.New)
      .gte("reviewed_at", startOfDay.toISOString());

    const remainingNewAllowance = Math.max(0, config.newCardsPerDay - (newDoneToday ?? 0));

    // Cards rated Easy today (in any review mode) are skipped to avoid same-day double-review
    const { data: easyTodayRows } = await supabase
      .from("review_log")
      .select("card_srs_id")
      .eq("rating", Rating.Easy)
      .gte("reviewed_at", startOfDay.toISOString());
    const easyTodayIds = (easyTodayRows ?? []).map((r) => r.card_srs_id);

    const buildDue = () => {
      let q = supabase
        .from("card_srs")
        .select(cardSelect)
        .neq("state", State.New)
        .lte("due", now)
        .order("due", { ascending: true });
      if (easyTodayIds.length > 0) q = q.not("id", "in", `(${easyTodayIds.join(",")})`);
      return q;
    };
    const { data: dueRows, error: dueError } = await fetchAll(buildDue);

    if (dueError) return NextResponse.json({ error: dueError.message }, { status: 500 });

    let newRows: typeof dueRows = [];
    if (remainingNewAllowance > 0) {
      // New cards are introduced newest-lesson-first. Ordering by `due` alone means
      // insertion order, which drip-feeds the earliest lessons for months while the
      // current lesson's words never surface. Within a lesson `due ASC` still holds,
      // so lesson progression is preserved — that part is intentional.
      const buildNew = () => {
        let q = supabase
          .from("card_srs")
          .select(cardSelect)
          .eq("state", State.New)
          .lte("due", now)
          .order("due", { ascending: true });
        if (easyTodayIds.length > 0) q = q.not("id", "in", `(${easyTodayIds.join(",")})`);
        return q;
      };
      const { data: newCandidates, error: newError } = await fetchAll(buildNew);
      if (newError) return NextResponse.json({ error: newError.message }, { status: 500 });

      const { data: lessonRows } = await supabase.from("lessons").select("id, date");
      // Lessonless cards sort last, never ahead of a real lesson
      const lessonDate = new Map((lessonRows ?? []).map((l) => [l.id, l.date ?? ""]));
      const rank = (row: NonNullable<typeof newCandidates>[number]) => {
        const card = Array.isArray(row.card) ? row.card[0] : row.card;
        return lessonDate.get(card?.lesson_id ?? "") ?? "";
      };

      newRows = (newCandidates ?? [])
        .slice()
        .sort((a, b) => rank(b).localeCompare(rank(a)))
        .slice(0, remainingNewAllowance);
    }

    rows = [...(dueRows ?? []), ...newRows];
  }

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
        audio_start_sec: card?.audio_start_sec ?? null,
        audio_end_sec: card?.audio_end_sec ?? null,
      };
    })
  );

  return NextResponse.json({
    cards: withAudioUrl,
    remaining_due: modeAll ? withAudioUrl.length : 0,
    remaining_new: 0,
  });
}
