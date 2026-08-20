import { PageHeader, Card } from "@/components/ui";
import { requireSuperAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformRestaurantsPage() {
  await requireSuperAdminPage();
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { employees: true, sales: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Restaurants" description="All tenants on the platform" />
      <ul className="card divide-y divide-[var(--line-soft)] overflow-hidden">
        {restaurants.map((r) => (
          <li key={r.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {r.phone || "No phone"} · {r.status}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {r._count.employees} employees · {r._count.sales} bills
                </p>
                {r.memberships.map((m) => (
                  <p key={m.id} className="text-xs text-[var(--muted)]">
                    Admin: {m.user.name} ({m.user.email})
                  </p>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
