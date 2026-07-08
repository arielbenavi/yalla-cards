import { supabaseAdmin } from "@/lib/supabase";
import type { ParsedCard } from "@/lib/gemini";

export type InboxRow = ParsedCard & {
  duplicate_of: { id: string; hebrew_meaning: string; translit_nikud: string; similarity: number } | null;
};

export async function attachDuplicates(rows: ParsedCard[]): Promise<InboxRow[]> {
  const supabase = supabaseAdmin();
  return Promise.all(
    rows.map(async (row) => {
      const { data } = await supabase.rpc("find_similar_cards", {
        query: row.translit_nikud,
        threshold: 0.4,
      });
      return { ...row, duplicate_of: data?.[0] ?? null };
    })
  );
}
