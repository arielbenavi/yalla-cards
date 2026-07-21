import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAdmin = isValidAuthCookie(request.cookies.get(AUTH_COOKIE)?.value);
  return NextResponse.json({ isAdmin });
}
