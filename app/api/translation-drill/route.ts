import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { currentMeeting } from "@/lib/current-meeting";

// The book's translation exercises (paradigms rows with data.type =
// "translation_drill"), for /translate. Read only; attempts are not stored.
export async function GET() {
  const supabase = supabaseAdmin();
  const meeting = await currentMeeting(supabase);
  const { data, error } = await supabase
    .from("paradigms")
    .select("id, meeting, slug, data")
    .eq("data->>type", "translation_drill")
    .order("meeting");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sets = (data ?? []).map((r) => {
    const d = r.data as {
      title: string;
      source: string;
      dir: "ar_to_he" | "he_to_ar";
      items: { num: number; ar: string; he: string }[];
    };
    return { id: r.slug, meeting: r.meeting, title: d.title, source: d.source, dir: d.dir, items: d.items };
  });
  return NextResponse.json({ sets, current_meeting: meeting });
}
