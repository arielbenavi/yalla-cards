"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseAuthBrowser } from "@/lib/supabase-auth-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(true);
      return;
    }

    router.replace(searchParams.get("from") || "/review");
    router.refresh();
  }

  const unauthorizedError = searchParams.get("error") === "unauthorized";

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = supabaseAuthBrowser();
    const from = searchParams.get("from") || "/review";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(from)}`,
      },
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 text-center">
      {/* App description */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">יאללה כרטיסים 🃏</h1>
        <p className="text-sm text-gray-500">
          כרטיסיות SRS לערבית פלסטינית — חזרה חכמה על אוצר המילים שלך
        </p>
      </div>

      {unauthorizedError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2 text-right">
          החשבון הזה לא מאושר לגישה לאפליקציה.
        </p>
      )}

      {/* Primary: Google login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || submitting}
        className="flex items-center justify-center gap-3 border rounded-xl px-4 py-3.5 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 font-semibold text-base shadow-sm transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M47.532 24.552c0-1.636-.132-3.204-.384-4.704H24.48v8.892h12.96c-.564 2.988-2.22 5.52-4.716 7.224v6h7.632c4.464-4.116 7.176-10.176 7.176-17.412z" fill="#4285F4"/>
          <path d="M24.48 48c6.48 0 11.916-2.148 15.888-5.832l-7.632-6c-2.148 1.44-4.908 2.292-8.256 2.292-6.348 0-11.724-4.284-13.644-10.044H3V34.8C6.972 42.648 15.108 48 24.48 48z" fill="#34A853"/>
          <path d="M10.836 28.416A14.46 14.46 0 0 1 10.02 24c0-1.536.264-3.024.816-4.416V13.2H3A23.955 23.955 0 0 0 .48 24c0 3.864.924 7.524 2.52 10.8l7.836-6.384z" fill="#FBBC05"/>
          <path d="M24.48 9.54c3.576 0 6.78 1.236 9.312 3.648l6.948-6.948C36.384 2.388 30.96 0 24.48 0 15.108 0 6.972 5.352 3 13.2l7.836 6.384C12.756 13.824 18.132 9.54 24.48 9.54z" fill="#EA4335"/>
        </svg>
        {googleLoading ? "מתחבר..." : "כניסה עם Google"}
      </button>

      {/* Secondary: admin link */}
      {!showAdminForm ? (
        <button
          type="button"
          onClick={() => setShowAdminForm(true)}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          כניסת אדמין
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border rounded-xl p-4 bg-gray-50 text-right">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">סיסמה (אדמין)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2 bg-white text-sm"
              autoFocus
            />
          </label>
          {error && <p className="text-red-600 text-xs">סיסמה שגויה</p>}
          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="bg-gray-800 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "..." : "כניסה"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
