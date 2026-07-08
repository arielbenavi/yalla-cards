"use client";

import { createClient } from "@supabase/supabase-js";

// Public anon-key client used only for direct browser -> Storage uploads via
// signed upload URLs. Authorization for the upload comes from the signed
// token itself, not from RLS, so the anon key does not need table access.
export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
