import type { SupabaseClient } from "@supabase/supabase-js";

/** The course meeting Ariel is on: the newest book lesson. Practice lists start from it. */
export async function currentMeeting(supabase: SupabaseClient): Promise<number | null> {
  const { data } = await supabase
    .from("lessons")
    .select("meeting")
    .eq("source", "book")
    .not("meeting", "is", null)
    .order("date", { ascending: false })
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
