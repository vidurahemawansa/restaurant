import { PageHeader, Card } from "@/components/ui";
import { requireSuperAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  await requireSuperAdminPage();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { include: { restaurant: { select: { name: true } } } },
      employeeProfile: { include: { restaurant: { select: { name: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="All platform users" />
      <ul className="card divide-y divide-[var(--line-soft)] overflow-hidden">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-sm text-[var(--muted)]">{u.email}</p>
              <p className="text-xs text-[var(--muted)]">
                {u.role} · {u.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
