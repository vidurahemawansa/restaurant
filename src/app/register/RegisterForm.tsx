"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthDivider, GoogleSignInButton } from "@/components/GoogleSignInButton";

type RegisterFormProps = {
  googleAuthEnabled?: boolean;
};

export default function RegisterForm({ googleAuthEnabled = false }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(data.redirectTo || "/register/restaurant");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="page-title">Create account</h1>
          <p className="page-sub">Register as restaurant owner</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          {googleAuthEnabled ? (
            <>
              <GoogleSignInButton label="Sign up with Google" mode="signup" />
              <AuthDivider />
            </>
          ) : null}
          <label className="block">
            <span className="section-title mb-1.5 block">Your name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field field-lg w-full"
            />
          </label>
          <label className="block">
            <span className="section-title mb-1.5 block">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field field-lg w-full"
            />
          </label>
          <label className="block">
            <span className="section-title mb-1.5 block">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field field-lg w-full"
              placeholder="Min 8 characters"
            />
          </label>
          {error ? <p className="alert alert-error">{error}</p> : null}
          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
