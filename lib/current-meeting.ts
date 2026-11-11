import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The course meeting Ariel is on: the highest meeting number among the book lessons. Practice
 * lists start from it. Not by lesson date: מפגש 8's lesson is dated earlier than 7's, which
 * put 7 first and 8 after it (2026-11-10, "תעשה את זה לפי הסדר").
 */
export async function currentMeeting(supabase: SupabaseClient): Promise<number | null> {
  const { data } = await supabase
    .from("lessons")
    .select("meeting")
    .eq("source", "book")
    .not("meeting", "is", null)
    .order("meeting", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.meeting as number | undefined) ?? null;
}

/** Newest material first: the current meeting, then the rest from high to low. */
export function byMeetingOrder(current: number | null) {
  return (a: number | null, b: number | null) => {
    const rank = (m: number | null) => (m == null ? -1 : m === current ? Infinity : m);
    return rank(b) - rank(a);
  };
}
