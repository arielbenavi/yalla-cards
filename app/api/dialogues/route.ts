import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Stored conversation dialogues (paradigms rows with a simulation_* slug).
 *
 *  Only chatifai-verified rows are served. The rest were produced by a
 *  general-purpose model and contain real errors — chatifai's audit of the first
 *  one found a gender mistake and two unnatural lines — so they must not reach a
 *  learner until they have been through the same review. Pass ?all=1 to list
 *  every dialogue with its verification state, for the admin view.
 */
export async function GET(request: Request) {
  const includeUnverified = new URL(request.url).searchParams.get("all") === "1";
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("paradigms")
    .select("id, slug, data")
    .like("slug", "simulation_%")
    .order("slug", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dialogues = (data ?? [])
    .map((row) => {
      const d = row.data as {
        turns?: unknown[];
        chatifai_verified?: boolean;
        verification_note?: string;
        description?: string;
      };
      return {
        id: row.id,
        slug: row.slug,
        key: row.slug.replace(/^simulation_/, ""),
        description: d?.description ?? null,
        verified: d?.chatifai_verified === true,
        verification_note: d?.verification_note ?? null,
        turn_count: Array.isArray(d?.turns) ? d.turns.length : 0,
        turns: d?.turns ?? [],
      };
    })
    .filter((d) => includeUnverified || d.verified);

  return NextResponse.json({
    dialogues,
    total: (data ?? []).length,
    verified: (data ?? []).filter(
      (r) => (r.data as { chatifai_verified?: boolean })?.chatifai_verified === true
    ).length,
  });
}
