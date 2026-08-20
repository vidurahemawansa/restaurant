import { CostAnalysisClient } from "@/components/CostAnalysisClient";
import { PageHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CostsReportPage() {
  await requireRestaurantAdminPage();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Major Costs"
        description="What are you spending the most money on?"
      />
      <CostAnalysisClient />
    </div>
  );
}
