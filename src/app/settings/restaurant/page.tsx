import { RestaurantProfileForm } from "@/components/RestaurantProfileForm";
import { PageHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage() {
  const { restaurantId } = await requireRestaurantAdminPage();
  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant profile"
        description="Name, address, logo and photos for your business"
      />
      <RestaurantProfileForm initial={restaurant} />
    </div>
  );
}
