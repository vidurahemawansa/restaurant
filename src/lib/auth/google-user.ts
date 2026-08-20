import { prisma } from "@/lib/db";
import type { GoogleProfile } from "./google";

/**
 * Find existing user by Google ID or email, or create a new restaurant admin.
 * Never creates SUPER_ADMIN via Google — existing roles are preserved.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const email = profile.email.toLowerCase().trim();

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: profile.sub }, { email }],
    },
    include: { memberships: true, employeeProfile: true },
  });

  if (user) {
    if (user.status !== "ACTIVE") {
      throw new Error("Account is inactive. Contact your administrator.");
    }

    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.sub },
        include: { memberships: true, employeeProfile: true },
      });
    }

    if (profile.name && user.name !== profile.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: profile.name },
        include: { memberships: true, employeeProfile: true },
      });
    }

    return user;
  }

  return prisma.user.create({
    data: {
      name: profile.name?.trim() || email.split("@")[0],
      email,
      googleId: profile.sub,
      role: "RESTAURANT_ADMIN",
    },
    include: { memberships: true, employeeProfile: true },
  });
}
