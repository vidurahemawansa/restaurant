import { NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/client";
import { getCurrentUser, type AuthUser } from "@/lib/auth/session";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function requireRole(user: AuthUser, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
}

export async function requireAuth(roles?: UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  if (roles) requireRole(user, roles);
  return user;
}

export async function requireSuperAdmin() {
  return requireAuth(["SUPER_ADMIN"]);
}

/** Restaurant admin or super admin with explicit restaurant access */
export async function requireRestaurantAccess(requestedRestaurantId?: string) {
  const user = await requireAuth();

  if (user.role === "SUPER_ADMIN") {
    if (!requestedRestaurantId) {
      throw new AuthError("Restaurant ID required", 400);
    }
    return { user, restaurantId: requestedRestaurantId };
  }

  if (user.role !== "RESTAURANT_ADMIN") {
    throw new AuthError("Forbidden", 403);
  }

  const restaurantId = requestedRestaurantId ?? user.restaurantId;
  if (!restaurantId) {
    throw new AuthError("No restaurant associated with this account", 403);
  }

  if (!user.restaurantIds.includes(restaurantId)) {
    throw new AuthError("Forbidden", 403);
  }

  return { user, restaurantId };
}

/** Default restaurant for logged-in restaurant admin */
export async function requireRestaurantAdmin() {
  const user = await requireAuth(["RESTAURANT_ADMIN", "SUPER_ADMIN"]);

  if (user.role === "SUPER_ADMIN") {
    throw new AuthError("Use platform endpoints", 403);
  }

  if (!user.restaurantId) {
    throw new AuthError("Register a restaurant first", 403);
  }

  return { user, restaurantId: user.restaurantId };
}

export async function requireEmployeeSelf() {
  const user = await requireAuth(["EMPLOYEE"]);
  if (!user.employeeId || !user.restaurantId) {
    throw new AuthError("Employee profile not found", 403);
  }
  return { user, employeeId: user.employeeId, restaurantId: user.restaurantId };
}

export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function canAccessFinancials(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "RESTAURANT_ADMIN";
}
