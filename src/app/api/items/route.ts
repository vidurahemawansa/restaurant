import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { findSimilarPurchaseItem } from "@/lib/purchase-items.server";
import { seedPurchaseCategories } from "@/lib/purchase-categories";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const { searchParams } = request.nextUrl;
    const filter = searchParams.get("filter") ?? "active";
    const q = searchParams.get("q")?.trim().toLowerCase();

    const where: {
      restaurantId: string;
      active?: boolean;
    } = { restaurantId };

    if (filter === "active") where.active = true;
    else if (filter === "inactive") where.active = false;

    let items = await prisma.purchaseItem.findMany({
      where,
      include: {
        category: true,
        defaultSupplier: { select: { id: true, name: true } },
      },
      orderBy: [{ useCount: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    if (q) {
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }

    const categories = await prisma.purchaseItemCategory.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const suppliers = await prisma.supplier.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items, categories, suppliers });
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
      return NextResponse.json({ error: "Item name required" }, { status: 400 });
    }

    const similar = await findSimilarPurchaseItem(restaurantId, name);
    if (similar) {
      return NextResponse.json(
        {
          error: "This item may already exist.",
          similarItem: similar,
        },
        { status: 409 }
      );
    }

    let categoryId = body.categoryId as string | undefined;
    if (!categoryId && body.category) {
      const cat = await prisma.purchaseItemCategory.findUnique({
        where: { restaurantId_name: { restaurantId, name: String(body.category) } },
      });
      categoryId = cat?.id;
    }
    if (!categoryId) {
      const cats = await seedPurchaseCategories(restaurantId, prisma);
      categoryId = cats.find((c) => c.name === "Other")?.id ?? cats[0]?.id;
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category required" }, { status: 400 });
    }

    const catExists = await prisma.purchaseItemCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!catExists) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (body.defaultSupplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: body.defaultSupplierId, restaurantId },
      });
      if (!supplier) {
        return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
      }
    }

    const item = await prisma.purchaseItem.create({
      data: {
        restaurantId,
        categoryId,
        name,
        defaultUnit: body.defaultUnit?.trim() || null,
        defaultSupplierId: body.defaultSupplierId || null,
        active: body.active !== false,
        sortOrder: Number(body.sortOrder ?? 50),
      },
      include: {
        category: true,
        defaultSupplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
