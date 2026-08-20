import { CostTrendClient } from "@/components/CostTrendClient";
import { PageHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TrendsReportPage() {
  const { restaurantId } = await requireRestaurantAdminPage();
  const items = await prisma.purchaseItem.findMany({
    where: { restaurantId, active: true },
    orderBy: [{ useCount: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Trends"
        description="Track spending on key items over time"
      />
      <CostTrendClient items={items} />
    </div>
  );
}
