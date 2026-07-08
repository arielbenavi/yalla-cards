import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, createAuthCookieValue } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const { value, maxAge } = createAuthCookieValue();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
