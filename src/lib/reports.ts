import { prisma } from "@/lib/db";
import { endOfDay, percent, startOfDay } from "@/lib/utils";

export type CostByItem = {
  itemId: string;
  name: string;
  category: string;
  totalAmount: number;
  percentOfTotal: number;
  purchaseCount: number;
  quantity: number | null;
  averageAmount: number;
};

export type CostByCategory = {
  category: string;
  totalAmount: number;
  percentOfTotal: number;
  purchaseCount: number;
};

export async function getMajorCostAnalysis(restaurantId: string, from: Date, to: Date) {
  const fromDate = startOfDay(from);
  const toDate = endOfDay(to);

  const lines = await prisma.purchaseLine.findMany({
    where: {
      purchase: { restaurantId, date: { gte: fromDate, lte: toDate } },
    },
    include: { item: { include: { category: true } }, purchase: true },
  });

  const itemMap = new Map<
    string,
    {
      itemId: string;
      name: string;
      category: string;
      totalAmount: number;
      purchaseIds: Set<string>;
      quantitySum: number;
      hasQuantity: boolean;
    }
  >();

  const categoryMap = new Map<
    string,
    { category: string; totalAmount: number; purchaseIds: Set<string> }
  >();

  let grandTotal = 0;

  for (const line of lines) {
    grandTotal += line.amount;

    const item = itemMap.get(line.itemId) ?? {
      itemId: line.itemId,
      name: line.item.name,
      category: line.item.category.name,
      totalAmount: 0,
      purchaseIds: new Set<string>(),
      quantitySum: 0,
      hasQuantity: false,
    };
    item.totalAmount += line.amount;
    item.purchaseIds.add(line.purchaseId);
    if (line.quantity != null) {
      item.quantitySum += line.quantity;
      item.hasQuantity = true;
    }
    itemMap.set(line.itemId, item);

    const cat = categoryMap.get(line.item.category.name) ?? {
      category: line.item.category.name,
      totalAmount: 0,
      purchaseIds: new Set<string>(),
    };
    cat.totalAmount += line.amount;
    cat.purchaseIds.add(line.purchaseId);
    categoryMap.set(line.item.category.name, cat);
  }

  const byItem: CostByItem[] = [...itemMap.values()]
    .map((i) => ({
      itemId: i.itemId,
      name: i.name,
      category: i.category,
      totalAmount: i.totalAmount,
      percentOfTotal: percent(i.totalAmount, grandTotal),
      purchaseCount: i.purchaseIds.size,
      quantity: i.hasQuantity ? i.quantitySum : null,
      averageAmount: i.purchaseIds.size === 0 ? 0 : i.totalAmount / i.purchaseIds.size,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const byCategory: CostByCategory[] = [...categoryMap.values()]
    .map((c) => ({
      category: c.category,
      totalAmount: c.totalAmount,
      percentOfTotal: percent(c.totalAmount, grandTotal),
      purchaseCount: c.purchaseIds.size,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return { grandTotal, byItem, byCategory };
}

export type TrendPoint = {
  label: string;
  amount: number;
  quantity: number | null;
  averagePrice: number | null;
};

export async function getCostTrend(
  restaurantId: string,
  itemId: string,
  from: Date,
  to: Date,
  granularity: "daily" | "weekly" | "monthly"
): Promise<TrendPoint[]> {
  const lines = await prisma.purchaseLine.findMany({
    where: {
      itemId,
      purchase: { restaurantId, date: { gte: startOfDay(from), lte: endOfDay(to) } },
    },
    include: { purchase: true },
    orderBy: { purchase: { date: "asc" } },
  });

  const buckets = new Map<
    string,
    { label: string; amount: number; quantitySum: number; hasQty: boolean; sortKey: string }
  >();

  for (const line of lines) {
    const d = new Date(line.purchase.date);
    let key: string;
    let label: string;

    if (granularity === "daily") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      label = key;
    } else if (granularity === "weekly") {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = `${weekStart.getFullYear()}-W${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
      label = `Week of ${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }

    const bucket = buckets.get(key) ?? {
      label,
      amount: 0,
      quantitySum: 0,
      hasQty: false,
      sortKey: key,
    };
    bucket.amount += line.amount;
    if (line.quantity != null) {
      bucket.quantitySum += line.quantity;
      bucket.hasQty = true;
    }
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((b) => ({
      label: b.label,
      amount: b.amount,
      quantity: b.hasQty ? b.quantitySum : null,
      averagePrice: b.hasQty && b.quantitySum > 0 ? b.amount / b.quantitySum : null,
    }));
}
