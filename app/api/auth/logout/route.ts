import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { supabaseAuthServer } from "@/lib/supabase-auth-server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(AUTH_COOKIE);

  // Also sign out of Supabase OAuth session if one exists
  try {
    const supabase = await supabaseAuthServer();
    await supabase.auth.signOut();
  } catch {
    // Ignore — user may not have an OAuth session
  }

  return response;
}
