"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthDivider, GoogleAuthError, GoogleSignInButton } from "@/components/GoogleSignInButton";

type LoginFormProps = {
  googleAuthEnabled?: boolean;
};

export default function LoginForm({ googleAuthEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleError = searchParams.get("error");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(searchParams.get("from") || data.redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-2xl font-bold text-white">
            K
          </span>
          <h1 className="page-title">Welcome back</h1>
          <p className="page-sub">Sign in to your restaurant</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          {googleError ? <GoogleAuthError code={googleError} /> : null}
          {googleAuthEnabled ? (
            <>
              <GoogleSignInButton label="Continue with Google" mode="signin" />
              <AuthDivider />
            </>
          ) : null}
          <label className="block">
            <span className="section-title mb-1.5 block">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field field-lg w-full"
              placeholder="you@restaurant.com"
            />
          </label>
          <label className="block">
            <span className="section-title mb-1.5 block">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field field-lg w-full"
            />
          </label>
          {error ? <p className="alert alert-error">{error}</p> : null}
          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          New owner?{" "}
          <Link href="/register" className="font-semibold text-[var(--accent)]">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
