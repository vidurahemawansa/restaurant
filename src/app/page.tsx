import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { OnboardingPrompt } from "@/components/OnboardingPrompt";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  if (user.role === "SUPER_ADMIN") redirect("/platform");
  if (user.role === "EMPLOYEE") redirect("/my");

  if (!user.restaurantId) {
    return <OnboardingPrompt userName={user.name} />;
  }

  const data = await getDashboardData(user.restaurantId);
  return <DashboardShell data={data} />;
}
