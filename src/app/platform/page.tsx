import Link from "next/link";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { requireSuperAdminPage } from "@/lib/auth";
import { getPlatformStats } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { formatLKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  await requireSuperAdminPage();
  const stats = await getPlatformStats();
  const recentRestaurants = await prisma.restaurant.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { employees: true, sales: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Platform" description="Super Admin overview" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Restaurants" value={stats.restaurants} accent />
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Employees" value={stats.employees} />
        <StatCard label="Total sales" value={formatLKR(stats.salesTotal)} />
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold">Recent restaurants</h2>
        <ul className="divide-y divide-[var(--line-soft)]">
          {recentRestaurants.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {r.status} · {r._count.employees} staff · {r._count.sales} bills
                </p>
              </div>
              <Link href={`/platform/restaurants`} className="text-sm text-[var(--accent)]">
                View
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
