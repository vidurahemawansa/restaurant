import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { isGoogleAuthConfigured } from "@/lib/auth/google";

export default function LoginPage() {
  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>}>
      <LoginForm googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
