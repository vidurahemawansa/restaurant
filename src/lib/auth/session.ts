import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { UserRole, UserStatus } from "@/generated/prisma/client";

export const SESSION_COOKIE = "kl_session";
export const SESSION_DAYS = 30;

import { resolveActiveRestaurantId } from "./restaurant";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  restaurantIds: string[];
  employeeId: string | null;
  restaurantId: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function generateToken() {
  return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserFromSessionToken(token: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: { select: { restaurantId: true } },
          employeeProfile: { select: { id: true, restaurantId: true } },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const user = session.user;
  if (user.status !== "ACTIVE") return null;

  const restaurantIds = user.memberships.map((m) => m.restaurantId);
  const employeeRestaurantId = user.employeeProfile?.restaurantId ?? null;

  let restaurantId: string | null = null;
  if (user.role === "RESTAURANT_ADMIN" && restaurantIds.length > 0) {
    restaurantId = resolveActiveRestaurantId(restaurantIds, session.activeRestaurantId);
  } else if (user.role === "EMPLOYEE" && employeeRestaurantId) {
    restaurantId = employeeRestaurantId;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    restaurantIds,
    employeeId: user.employeeProfile?.id ?? null,
    restaurantId,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserFromSessionToken(token);
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getDashboardPath(role: UserRole, _hasRestaurant?: boolean) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/platform";
    case "RESTAURANT_ADMIN":
      return "/";
    case "EMPLOYEE":
      return "/my";
    default:
      return "/login";
  }
}
