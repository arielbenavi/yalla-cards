import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Stored conversation dialogues (paradigms rows with a simulation_* slug).
 *
 *  The gate exists because most of these were produced by a general-purpose
 *  model and contain real errors — chatifai's audit of the first one found a
 *  gender mistake and two unnatural lines — so unreviewed machine Arabic must
 *  not reach a learner.
 *
 *  `course_verified` passes the same gate. The מפגש 8 dialogue was typed out of
 *  the book, already pointed, and the course outranks chatifai on anything that
 *  came from a lesson; holding it back would be applying a rule about
 *  AI-generated text to text no model wrote. Pass ?all=1 to list every dialogue
 *  with its verification state, for the admin view.
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
        course_verified?: boolean;
        verification_note?: string;
        description?: string;
        /** Verbatim lesson text attached to the scene (note 97311b79). Not a
         *  turn and not drilled — the course's own words, shown as reference. */
        course_material?: {
          title?: string;
          source?: string;
          note?: string;
          paragraphs?: string[];
        };
      };
      return {
        id: row.id,
        slug: row.slug,
        key: row.slug.replace(/^simulation_/, ""),
        description: d?.description ?? null,
        verified: d?.chatifai_verified === true || d?.course_verified === true,
        source: d?.course_verified === true && d?.chatifai_verified !== true ? "course" : "chatifai",
        verification_note: d?.verification_note ?? null,
        turn_count: Array.isArray(d?.turns) ? d.turns.length : 0,
        turns: d?.turns ?? [],
        course_material: d?.course_material ?? null,
      };
    })
    .filter((d) => includeUnverified || d.verified);

  return NextResponse.json({
    dialogues,
    total: (data ?? []).length,
    verified: (data ?? []).filter((r) => {
      const d = r.data as { chatifai_verified?: boolean; course_verified?: boolean };
      return d?.chatifai_verified === true || d?.course_verified === true;
    }).length,
  });
}
