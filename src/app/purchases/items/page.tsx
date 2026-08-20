import Link from "next/link";
import { PurchaseItemMaster } from "@/components/PurchaseItemMaster";
import { PageHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seedPurchaseCategories } from "@/lib/purchase-categories";

export const dynamic = "force-dynamic";

export default async function PurchaseItemsPage() {
  const { restaurantId } = await requireRestaurantAdminPage();

  let categories = await prisma.purchaseItemCategory.findMany({
    where: { restaurantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  if (categories.length === 0) {
    await seedPurchaseCategories(restaurantId, prisma);
    categories = await prisma.purchaseItemCategory.findMany({
      where: { restaurantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  const [items, suppliers] = await Promise.all([
    prisma.purchaseItem.findMany({
      where: { restaurantId },
      include: { category: true },
      orderBy: [{ active: "desc" }, { category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.supplier.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase items"
        description="Reusable items for fast purchase entry"
        action={
          <Link href="/purchases" className="btn-outline">
            + New purchase
          </Link>
        }
      />
      <PurchaseItemMaster initialItems={items} categories={categories} suppliers={suppliers} />
    </div>
  );
}
