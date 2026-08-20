import { Suspense } from "react";
import RegisterForm from "./RegisterForm";
import { isGoogleAuthConfigured } from "@/lib/auth/google";

export default function RegisterPage() {
  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>}>
      <RegisterForm googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
