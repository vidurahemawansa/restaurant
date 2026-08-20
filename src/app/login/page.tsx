import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/google";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(getDashboardPath(user.role, Boolean(user.restaurantId)));
  }

  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>}>
      <LoginForm googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
