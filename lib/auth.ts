import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseAuthServer } from "@/lib/supabase-auth-server";

export const AUTH_COOKIE = "yalla_auth";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function sign(expiry: string) {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(expiry).digest("hex");
}

export function createAuthCookieValue(): { value: string; maxAge: number } {
  const expiry = String(Date.now() + MAX_AGE_SEC * 1000);
  return { value: `${expiry}.${sign(expiry)}`, maxAge: MAX_AGE_SEC };
}

export function isValidAuthCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [expiry, signature] = cookieValue.split(".");
  if (!expiry || !signature) return false;
  if (Date.now() > Number(expiry)) return false;

  const expected = sign(expiry);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Returns true if there is a valid Supabase OAuth session (Google login).
export async function isValidSupabaseSession(): Promise<boolean> {
  try {
    const supabase = await supabaseAuthServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  } catch {
    return false;
  }
}

// The admin is Ariel: his Google account, or the password cookie (kept for the
// Playwright tests and scripts, at /login?password=1). Before 2026-10-29 only the
// password counted, so on his own Google login the admin tools — and /simulate —
// were closed to him.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "ariel5rols@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  if (isValidAuthCookie(cookieStore.get(AUTH_COOKIE)?.value)) return true;
  try {
    const supabase = await supabaseAuthServer();
    const { data: { user } } = await supabase.auth.getUser();
    return ADMIN_EMAILS.includes((user?.email ?? "").toLowerCase());
  } catch {
    return false;
  }
}
