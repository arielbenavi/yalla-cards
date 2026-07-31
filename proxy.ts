import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";

const PUBLIC = ["/login", "/auth/callback"];
const ADMIN_ONLY = ["/inbox", "/recordings", "/notes"];
// Lowercased on both sides: the list is hand-edited, and an address typed with
// a capital (Jonikremer1@gmail.com) would never match what the provider returns.
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Admin: valid HMAC cookie — fast path, no DB call
  const isAdmin = isValidAuthCookie(request.cookies.get(AUTH_COOKIE)?.value);
  if (isAdmin) return NextResponse.next();

  // Regular user: valid Supabase OAuth session
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Email allowlist: if configured, block users not on the list.
  // Note the app is open to any Google account whenever ALLOWED_EMAILS is unset.
  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes((user.email ?? "").toLowerCase())) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  // Regular user: block admin-only pages
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/review", request.url));
  }

  return response;
}

export const config = {
  // Skip static assets and all API routes (API routes use supabaseAdmin which is service-role)
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
