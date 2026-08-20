import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { seedPurchaseCategories } from "@/lib/purchase-categories";

export async function GET() {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    let categories = await prisma.purchaseItemCategory.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (categories.length === 0) {
      await seedPurchaseCategories(restaurantId, prisma);
      categories = await prisma.purchaseItemCategory.findMany({
        where: { restaurantId, active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    }

    return NextResponse.json({ categories });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Category name required" }, { status: 400 });
    }

    const existing = await prisma.purchaseItemCategory.findUnique({
      where: { restaurantId_name: { restaurantId, name } },
    });
    if (existing) {
      return NextResponse.json({ error: "Category already exists", category: existing }, { status: 409 });
    }

    const maxSort = await prisma.purchaseItemCategory.aggregate({
      where: { restaurantId },
      _max: { sortOrder: true },
    });

    const category = await prisma.purchaseItemCategory.create({
      data: {
        restaurantId,
        name,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
