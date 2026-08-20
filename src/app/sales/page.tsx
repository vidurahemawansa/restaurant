import { SalesEntry } from "@/components/SalesEntry";
import { BillScanner } from "@/components/BillScanner";
import { PageHeader, RecentList, SectionHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { restaurantId } = await requireRestaurantAdminPage();
  const [menuItems, recent] = await Promise.all([
    prisma.menuItem.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.sale.findMany({
      where: { restaurantId },
      take: 8,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { lines: { include: { menuItem: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sales"
        description="Enter quantities — prices apply automatically"
        action={<BillScanner menuItems={menuItems} />}
      />

      <SalesEntry menuItems={menuItems} />

      <section>
        <SectionHeader title="Recent sales" />
        <RecentList
          emptyMessage="No sales recorded yet."
          items={recent.map((s) => ({
            id: s.id,
            date: s.date,
            amount: s.totalAmount,
            detail: s.lines.map((l) => `${l.menuItem.name} ×${l.quantity}`).join(" · "),
          }))}
        />
      </section>
    </div>
  );
}
