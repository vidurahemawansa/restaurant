import { PurchaseEntry } from "@/components/PurchaseEntry";
import { PageHeader, RecentList, SectionHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seedPurchaseCategories } from "@/lib/purchase-categories";
import { formatLKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const { restaurantId } = await requireRestaurantAdminPage();

  let categories = await prisma.purchaseItemCategory.findMany({
    where: { restaurantId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  if (categories.length === 0) {
    await seedPurchaseCategories(restaurantId, prisma);
    categories = await prisma.purchaseItemCategory.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  const [items, suppliers, recent] = await Promise.all([
    prisma.purchaseItem.findMany({
      where: { restaurantId, active: true },
      include: { category: true },
      orderBy: [{ useCount: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.supplier.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.purchase.findMany({
      where: { restaurantId },
      take: 8,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { lines: { include: { item: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Purchase"
        description="Search item → quantity → price → add. Record a purchase in seconds."
      />

      <PurchaseEntry
        items={items}
        categories={categories}
        suppliers={suppliers}
      />

      <section>
        <SectionHeader title="Recent purchases" />
        <RecentList
          emptyMessage="No purchases recorded yet."
          items={recent.map((p) => ({
            id: p.id,
            date: p.date,
            amount: p.totalAmount,
            detail: p.lines
              .map((l) => {
                const qty =
                  l.quantity != null
                    ? ` ${l.quantity}${l.item.defaultUnit ? l.item.defaultUnit : ""}`
                    : "";
                return `${l.item.name}${qty} ${formatLKR(l.amount)}`;
              })
              .join(" · "),
          }))}
        />
      </section>
    </div>
  );
}
