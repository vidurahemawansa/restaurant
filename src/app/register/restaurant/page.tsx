import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { RestaurantSetupForm } from "./RestaurantSetupForm";

export default async function RegisterRestaurantPage() {
  const user = await requireUser();
  if (user.role !== "RESTAURANT_ADMIN") redirect("/");
  if (user.restaurantId) redirect("/");

  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="page-title">Set up your restaurant</h1>
      <p className="page-sub mb-6">
        Enter your restaurant details. Logo and photos can be added later from Profile settings.
      </p>
      <RestaurantSetupForm />
    </div>
  );
}
