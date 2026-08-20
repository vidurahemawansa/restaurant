import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { findSimilarPurchaseItem } from "@/lib/purchase-items.server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.purchaseItem.findFirst({
      where: { id, restaurantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      const similar = await findSimilarPurchaseItem(restaurantId, name);
      if (similar && similar.id !== id) {
        return NextResponse.json(
          { error: "This item may already exist.", similarItem: similar },
          { status: 409 }
        );
      }
      data.name = name;
    }

    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.defaultUnit !== undefined) data.defaultUnit = body.defaultUnit?.trim() || null;
    if (body.categoryId != null) {
      const cat = await prisma.purchaseItemCategory.findFirst({
        where: { id: body.categoryId, restaurantId },
      });
      if (!cat) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      data.categoryId = body.categoryId;
    }
    if (body.defaultSupplierId !== undefined) {
      if (body.defaultSupplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: body.defaultSupplierId, restaurantId },
        });
        if (!supplier) return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
      }
      data.defaultSupplierId = body.defaultSupplierId || null;
    }

    const item = await prisma.purchaseItem.update({
      where: { id },
      data,
      include: {
        category: true,
        defaultSupplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ item });
  } catch (err) {
    return authErrorResponse(err);
  }
}
