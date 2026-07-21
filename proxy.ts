import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";

const PUBLIC = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Admin: valid HMAC cookie — fast path, no DB call
  if (isValidAuthCookie(request.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next();

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
  if (user) return response;

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Skip static assets and all API routes (API routes use supabaseAdmin which is service-role)
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
