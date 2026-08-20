import { redirect } from "next/navigation";
import { getCurrentUser, type AuthUser } from "./session";

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRestaurantAdminPage() {
  const user = await requireUser();
  if (user.role === "SUPER_ADMIN") redirect("/platform");
  if (user.role === "EMPLOYEE") redirect("/my");
  if (!user.restaurantId) redirect("/");
  return { user, restaurantId: user.restaurantId };
}

export async function requireSuperAdminPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/");
  return user;
}

export async function requireEmployeePage() {
  const user = await requireUser();
  if (user.role !== "EMPLOYEE") redirect("/");
  if (!user.employeeId) redirect("/login");
  return { user, employeeId: user.employeeId };
}
