import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const restaurant = await prisma.restaurant.findUniqueOrThrow({
      where: { id: restaurantId },
      include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
    return NextResponse.json({ restaurant });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();

    const name = body.name != null ? String(body.name).trim() : undefined;
    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(body.address !== undefined ? { address: body.address?.trim() || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
        ...(body.whatsapp !== undefined ? { whatsapp: body.whatsapp?.trim() || null } : {}),
        ...(body.email !== undefined ? { email: body.email?.trim() || null } : {}),
        ...(body.openingTime !== undefined ? { openingTime: body.openingTime?.trim() || null } : {}),
        ...(body.closingTime !== undefined ? { closingTime: body.closingTime?.trim() || null } : {}),
        ...(body.currency !== undefined ? { currency: body.currency?.trim() || "LKR" } : {}),
        ...(body.taxRate !== undefined
          ? { taxRate: body.taxRate != null && body.taxRate !== "" ? Number(body.taxRate) : null }
          : {}),
        ...(body.deliveryEnabled !== undefined ? { deliveryEnabled: Boolean(body.deliveryEnabled) } : {}),
        ...(body.category !== undefined ? { category: body.category?.trim() || null } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
      },
      include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });

    return NextResponse.json({ restaurant });
  } catch (err) {
    return authErrorResponse(err);
  }
}
