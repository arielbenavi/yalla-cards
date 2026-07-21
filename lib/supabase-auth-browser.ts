"use client";

import { createBrowserClient } from "@supabase/ssr";

// Separate auth client using @supabase/ssr so it correctly manages
// auth cookies across the browser ↔ server boundary.
export function supabaseAuthBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
