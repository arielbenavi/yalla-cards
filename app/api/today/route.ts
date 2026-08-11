import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { State } from "@/lib/fsrs";
import { config } from "@/lib/config";

/**
 * The daily checklist (Ariel, 2026-08-11): daily review + inflection practice in
 * one place, because the inflections have no daily prompt and he was barely
 * touching them.
 *
 * Two different notions of "done", on purpose:
 *
 * **The review ticks itself.** Its completion is derived from the queue being
 * empty — nothing is written, nothing is read from `daily_practice`. That keeps
 * this endpoint on the right side of "חזרה יומית לא נוגעים": it observes the
 * review, it does not participate in it. It also cannot be gamed by opening the
 * page.
 *
 * **The drills need a mark**, because finishing an inflection table deliberately
 * leaves no trace — drills never write to card_srs, review_log or self_score.
 * `daily_practice` is that mark and holds nothing else.
 */

export type ChecklistItem = {
  key: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
  /** Only shown when there is something left to do. */
  remaining?: number;
};

/** Local calendar day. Deriving it from a UTC timestamp would roll the
 *  checklist over mid-evening in Israel, which is when he actually practises. */
function today(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jerusalem" });
}

export async function GET() {
  const supabase = supabaseAdmin();
  const day = today();
  const now = new Date().toISOString();

  const [{ count: dueCount }, { count: newCount }, { data: marks }] = await Promise.all([
    supabase
      .from("card_srs")
      .select("id", { count: "exact", head: true })
      .neq("state", State.New)
      .lte("due", now),
    supabase
      .from("card_srs")
      .select("id", { count: "exact", head: true })
      .eq("state", State.New),
    supabase.from("daily_practice").select("task").eq("day", day),
  ]);

  const marked = new Set((marks ?? []).map((m) => m.task));

  // New cards are capped per day, so "everything new" is not what is left to do
  // today — only the day's allowance is.
  const newToday = Math.min(newCount ?? 0, config.newCardsPerDay);
  const reviewRemaining = (dueCount ?? 0) + newToday;

  const items: ChecklistItem[] = [
    {
      key: "review",
      label: "חזרה יומית",
      hint: "הכרטיסים שהגיע זמנם + מנת החדשים של היום",
      href: "/review",
      done: reviewRemaining === 0,
      remaining: reviewRemaining || undefined,
    },
    {
      key: "inflections",
      label: "תרגול הטיות",
      hint: "טבלה אחת של הטיות — גופים, שייכות, מילות יחס",
      href: "/inflection-drill",
      done: marked.has("inflections"),
    },
    {
      key: "focused",
      label: "אימון ממוקד",
      hint: "מה שנכשל לאחרונה ומה שבסיכון להישכח",
      href: "/focused",
      done: marked.has("focused"),
    },
  ];

  return NextResponse.json({
    day,
    items,
    complete: items.every((i) => i.done),
  });
}

/**
 * Marks one checklist task done for today. Idempotent — the unique (day, task)
 * constraint makes a repeat press a no-op rather than a second row.
 *
 * `review` is rejected rather than accepted-and-ignored. Its state is derived
 * from the queue, and letting it be written here would create a second, forgeable
 * source of truth for the one thing that is not allowed to drift.
 */
export async function POST(request: Request) {
  const { task } = (await request.json().catch(() => ({}))) as { task?: string };
  if (task !== "inflections" && task !== "focused") {
    return NextResponse.json({ error: "unknown task" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("daily_practice")
    .upsert({ day: today(), task }, { onConflict: "day,task", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
