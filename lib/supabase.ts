import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only code (API routes, server components).
// Never import this from a "use client" file — the service role key bypasses RLS.
export function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
