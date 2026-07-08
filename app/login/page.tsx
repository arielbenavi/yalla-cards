"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { strings } from "@/lib/strings";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-bold">{strings.login.title}</h1>
      <label className="flex flex-col gap-1">
        <span>{strings.login.passwordLabel}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          autoFocus
        />
      </label>
      {error && <p className="text-red-600 text-sm">{strings.login.error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {strings.login.submit}
      </button>
    </form>
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
