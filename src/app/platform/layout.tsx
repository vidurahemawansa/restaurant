import { requireSuperAdminPage } from "@/lib/auth";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdminPage();
  return children;
}
