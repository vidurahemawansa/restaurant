import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "./session";

/** Resolve which restaurant is active for this admin session. */
export function resolveActiveRestaurantId(
  membershipIds: string[],
  sessionActiveId: string | null | undefined
): string | null {
  if (membershipIds.length === 0) return null;
  if (sessionActiveId && membershipIds.includes(sessionActiveId)) {
    return sessionActiveId;
  }
  return membershipIds[0];
}

export async function setActiveRestaurantOnSession(restaurantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { memberships: true } } },
  });
  if (!session) return;

  const allowed = session.user.memberships.some((m) => m.restaurantId === restaurantId);
  if (!allowed) return;

  await prisma.session.update({
    where: { id: session.id },
    data: { activeRestaurantId: restaurantId },
  });
}

export async function getActiveRestaurant(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: { include: { restaurant: true } },
        },
      },
    },
  });
  if (!session) return null;

  const membershipIds = session.user.memberships.map((m) => m.restaurantId);
  const activeId = resolveActiveRestaurantId(membershipIds, session.activeRestaurantId);
  if (!activeId) return null;

  const membership = session.user.memberships.find((m) => m.restaurantId === activeId);
  return membership?.restaurant ?? null;
}
