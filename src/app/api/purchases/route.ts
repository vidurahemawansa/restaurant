import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";
import { computeLineTotal } from "@/lib/purchase-item-utils";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const purchases = await prisma.purchase.findMany({
      where: { restaurantId },
      take: limit,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        lines: { include: { item: { include: { category: true } } } },
        supplier: true,
      },
    });
    return NextResponse.json(purchases);
  } catch (err) {
    return authErrorResponse(err);
  }
}

type LineInput = {
  itemId: string;
  amount?: number;
  quantity?: number | null;
  unitPrice?: number | null;
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const date = parseDateInput(body.date ?? new Date().toISOString().slice(0, 10));
    const lines: LineInput[] = body.lines ?? [];

    if (!lines.length) {
      return NextResponse.json({ error: "Add at least one item" }, { status: 400 });
    }

    const normalizedLines = lines.map((line) => {
      const qty =
        line.quantity != null && Number(line.quantity) > 0 ? Number(line.quantity) : null;
      const unitPrice =
        line.unitPrice != null && Number(line.unitPrice) > 0 ? Number(line.unitPrice) : null;
      let amount = line.amount != null ? Number(line.amount) : 0;
      if (qty && unitPrice) {
        amount = computeLineTotal(qty, unitPrice);
      }
      return { ...line, quantity: qty, unitPrice, amount };
    });

    for (const line of normalizedLines) {
      if (!line.itemId || !(line.amount > 0)) {
        return NextResponse.json(
          { error: "Each line needs an item and amount > 0" },
          { status: 400 }
        );
      }
    }

    const itemIds = normalizedLines.map((l) => l.itemId);
    const validItems = await prisma.purchaseItem.findMany({
      where: { id: { in: itemIds }, restaurantId },
    });
    if (validItems.length !== new Set(itemIds).size) {
      return NextResponse.json({ error: "Invalid purchase item" }, { status: 400 });
    }

    const totalAmount = normalizedLines.reduce((sum, l) => sum + l.amount, 0);

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          restaurantId,
          date,
          totalAmount,
          supplierId: body.supplierId || null,
          invoiceNumber: body.invoiceNumber || null,
          notes: body.notes || null,
          paymentMethod: body.paymentMethod || null,
          lines: {
            create: normalizedLines.map((l) => ({
              itemId: l.itemId,
              amount: l.amount,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              notes: l.notes || null,
            })),
          },
        },
        include: { lines: { include: { item: true } } },
      });

      const now = new Date();
      for (const line of normalizedLines) {
        const update: {
          useCount: { increment: number };
          lastUsedAt: Date;
          lastPurchasePrice?: number;
        } = {
          useCount: { increment: 1 },
          lastUsedAt: now,
        };
        if (line.unitPrice != null && line.unitPrice > 0) {
          update.lastPurchasePrice = line.unitPrice;
        } else if (line.quantity != null && line.quantity > 0) {
          update.lastPurchasePrice = line.amount / line.quantity;
        }
        await tx.purchaseItem.update({
          where: { id: line.itemId },
          data: update,
        });
      }
      return created;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
