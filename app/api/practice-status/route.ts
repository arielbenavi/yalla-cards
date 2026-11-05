import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { currentMeeting } from "@/lib/current-meeting";

/** Days without a practice before the bottom tab shows its red dot. */
const STALE_AFTER_DAYS = 3;
// Before this day the test suite wrote "done" marks to daily_practice on every run (note c9a2a71b),
// so older rows say nothing about whether Ariel practised.
const TRACKED_FROM = "2026-11-05";

function today(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jerusalem" });
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

// What has gone unpractised, from daily_practice. Read only, and nothing here reads or writes FSRS.
export async function GET() {
  const supabase = supabaseAdmin();
  const day = today();
  const [meeting, { data, error }] = await Promise.all([
    currentMeeting(supabase),
    supabase.from("daily_practice").select("task, day").in("task", ["inflections", "conversation"]).gte("day", TRACKED_FROM).order("day", { ascending: false }).limit(400),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const last = (task: string) => (data ?? []).find((r) => r.task === task)?.day as string | undefined;
  const item = (task: string, label: string, href: string) => {
    const lastDay = last(task);
    const days_since = lastDay ? daysBetween(lastDay, day) : null;
    return { task, label, href, days_since, stale: days_since == null || days_since >= STALE_AFTER_DAYS };
  };
  const inflections = item(
    "inflections",
    meeting ? `הטיות ממפגש ${meeting}` : "תרגול הטיות",
    meeting ? `/inflection-drill?meeting=${meeting}` : "/inflection-drill"
  );
  const conversation = item("conversation", "סיטואציה לתרגול", "/simulate?tab=dialogue");
  const items = [inflections, conversation];
  // What to offer next: whichever has waited longest, a never-done one first
  const waited = (i: (typeof items)[number]) => i.days_since ?? Infinity;
  const next = items.filter((i) => i.days_since !== 0).sort((a, b) => waited(b) - waited(a))[0] ?? null;

  return NextResponse.json({ current_meeting: meeting, items, stale: items.some((i) => i.stale), next });
}
