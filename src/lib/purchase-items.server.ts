import "server-only";

import { prisma } from "@/lib/db";
import { normalizePurchaseItemName } from "@/lib/purchase-item-utils";

export async function findSimilarPurchaseItem(restaurantId: string, name: string) {
  const normalized = normalizePurchaseItemName(name);
  if (!normalized) return null;

  const items = await prisma.purchaseItem.findMany({
    where: { restaurantId },
    select: { id: true, name: true, active: true },
  });

  return (
    items.find((item) => normalizePurchaseItemName(item.name) === normalized) ?? null
  );
}

export type PurchaseItemHistory = {
  item: {
    id: string;
    name: string;
    defaultUnit: string | null;
    lastPurchasePrice: number | null;
    categoryName: string;
  };
  lines: {
    id: string;
    date: Date;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
    purchaseId: string;
  }[];
  stats: {
    totalQuantity: number | null;
    totalAmount: number;
    averageUnitPrice: number | null;
    latestUnitPrice: number | null;
    highestUnitPrice: number | null;
    lowestUnitPrice: number | null;
    purchaseCount: number;
  };
};

export async function getPurchaseItemHistory(
  restaurantId: string,
  itemId: string
): Promise<PurchaseItemHistory | null> {
  const item = await prisma.purchaseItem.findFirst({
    where: { id: itemId, restaurantId },
    include: { category: true },
  });
  if (!item) return null;

  const lines = await prisma.purchaseLine.findMany({
    where: { itemId, purchase: { restaurantId } },
    include: { purchase: { select: { id: true, date: true } } },
    orderBy: { purchase: { date: "desc" } },
  });

  let totalQuantity = 0;
  let hasQuantity = false;
  const unitPrices: number[] = [];

  for (const line of lines) {
    if (line.quantity != null && line.quantity > 0) {
      totalQuantity += line.quantity;
      hasQuantity = true;
    }
    const up =
      line.unitPrice ??
      (line.quantity != null && line.quantity > 0 ? line.amount / line.quantity : null);
    if (up != null && up > 0) unitPrices.push(up);
  }

  const latestUnitPrice = unitPrices[0] ?? item.lastPurchasePrice ?? null;

  return {
    item: {
      id: item.id,
      name: item.name,
      defaultUnit: item.defaultUnit,
      lastPurchasePrice: item.lastPurchasePrice,
      categoryName: item.category.name,
    },
    lines: lines.map((l) => ({
      id: l.id,
      date: l.purchase.date,
      quantity: l.quantity,
      unitPrice:
        l.unitPrice ??
        (l.quantity != null && l.quantity > 0 ? l.amount / l.quantity : null),
      amount: l.amount,
      purchaseId: l.purchase.id,
    })),
    stats: {
      totalQuantity: hasQuantity ? totalQuantity : null,
      totalAmount: lines.reduce((s, l) => s + l.amount, 0),
      averageUnitPrice:
        unitPrices.length > 0
          ? unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length
          : null,
      latestUnitPrice,
      highestUnitPrice: unitPrices.length ? Math.max(...unitPrices) : null,
      lowestUnitPrice: unitPrices.length ? Math.min(...unitPrices) : null,
      purchaseCount: lines.length,
    },
  };
}
