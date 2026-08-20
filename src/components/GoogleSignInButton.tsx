"use client";

import { useSearchParams } from "next/navigation";

type GoogleSignInButtonProps = {
  label?: string;
  mode?: "signin" | "signup";
};

export function GoogleSignInButton({
  label = "Continue with Google",
  mode = "signin",
}: GoogleSignInButtonProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const href =
    "/api/auth/google" + (from ? `?from=${encodeURIComponent(from)}` : "");

  return (
    <a
      href={href}
      className="btn-google w-full"
      aria-label={mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
    >
      <GoogleIcon />
      {label}
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[var(--line-soft)]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-[var(--surface)] px-2 text-[var(--muted)]">or</span>
      </div>
    </div>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_state: "Sign-in expired. Please try again.",
  google_invalid: "Invalid Google sign-in response. Please try again.",
  google_not_configured: "Google sign-in is not configured on this server.",
  google_failed: "Google sign-in failed. Please try again.",
};

export function GoogleAuthError({ code }: { code: string | null }) {
  if (!code) return null;
  const message = ERROR_MESSAGES[code] ?? decodeURIComponent(code);
  return <p className="alert alert-error mb-4">{message}</p>;
}
