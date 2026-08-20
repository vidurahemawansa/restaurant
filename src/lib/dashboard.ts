import { prisma } from "@/lib/db";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "@/lib/utils";

export type DashboardData = {
  restaurantName: string;
  billCountToday: number;
  employeeCount: number;
  today: {
    sales: number;
    purchases: number;
    foodPurchases: number;
    salaries: number;
    otherExpenses: number;
    profit: number;
    topSoldFood: { name: string; quantity: number; revenue: number } | null;
  };
  month: {
    sales: number;
    purchases: number;
    salaries: number;
    otherExpenses: number;
    profit: number;
  };
  lastMonth: {
    sales: number;
    purchases: number;
    profit: number;
  };
  topCostItem: { name: string; amount: number } | null;
  majorCosts: { name: string; amount: number; percent: number }[];
};

const FOOD_CATEGORY_NAMES = new Set([
  "Meat",
  "Seafood",
  "Vegetables",
  "Rice & Grains",
  "Sauces",
  "Spices & Seasonings",
  "Beverages",
  // legacy names
  "Dry Goods",
  "Dairy",
  "Drinks",
  "Snacks",
  "Cooking",
]);

function tenantWhere(restaurantId: string) {
  return { restaurantId };
}

async function sumSales(restaurantId: string, from: Date, to: Date) {
  const result = await prisma.sale.aggregate({
    where: { ...tenantWhere(restaurantId), date: { gte: from, lte: to } },
    _sum: { totalAmount: true },
  });
  return result._sum.totalAmount ?? 0;
}

async function sumPurchases(restaurantId: string, from: Date, to: Date) {
  const result = await prisma.purchase.aggregate({
    where: { ...tenantWhere(restaurantId), date: { gte: from, lte: to } },
    _sum: { totalAmount: true },
  });
  return result._sum.totalAmount ?? 0;
}

async function sumSalaries(restaurantId: string, from: Date, to: Date) {
  const result = await prisma.salaryPayment.aggregate({
    where: { ...tenantWhere(restaurantId), date: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

async function sumExpenses(restaurantId: string, from: Date, to: Date) {
  const result = await prisma.expense.aggregate({
    where: { ...tenantWhere(restaurantId), date: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

async function foodPurchases(restaurantId: string, from: Date, to: Date) {
  const lines = await prisma.purchaseLine.findMany({
    where: {
      purchase: { restaurantId, date: { gte: from, lte: to } },
    },
    include: { item: { include: { category: true } } },
  });
  return lines
    .filter((l) => FOOD_CATEGORY_NAMES.has(l.item.category.name))
    .reduce((sum, l) => sum + l.amount, 0);
}

export async function getDashboardData(
  restaurantId: string,
  now = new Date()
): Promise<DashboardData> {
  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
  });

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const lastMonthStart = startOfMonth(lastMonthDate);
  const lastMonthEnd = endOfMonth(lastMonthDate);

  const [
    todaySales,
    todayPurchases,
    todayFood,
    todaySalaries,
    todayExpenses,
    monthSales,
    monthPurchases,
    monthSalaries,
    monthExpenses,
    lastSales,
    lastPurchases,
    lastSalaries,
    lastExpenses,
    billCountToday,
    employeeCount,
  ] = await Promise.all([
    sumSales(restaurantId, todayStart, todayEnd),
    sumPurchases(restaurantId, todayStart, todayEnd),
    foodPurchases(restaurantId, todayStart, todayEnd),
    sumSalaries(restaurantId, todayStart, todayEnd),
    sumExpenses(restaurantId, todayStart, todayEnd),
    sumSales(restaurantId, monthStart, monthEnd),
    sumPurchases(restaurantId, monthStart, monthEnd),
    sumSalaries(restaurantId, monthStart, monthEnd),
    sumExpenses(restaurantId, monthStart, monthEnd),
    sumSales(restaurantId, lastMonthStart, lastMonthEnd),
    sumPurchases(restaurantId, lastMonthStart, lastMonthEnd),
    sumSalaries(restaurantId, lastMonthStart, lastMonthEnd),
    sumExpenses(restaurantId, lastMonthStart, lastMonthEnd),
    prisma.sale.count({
      where: { restaurantId, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.employee.count({ where: { restaurantId, active: true } }),
  ]);

  const todayProfit = todaySales - todayPurchases - todaySalaries - todayExpenses;
  const monthProfit = monthSales - monthPurchases - monthSalaries - monthExpenses;
  const lastProfit = lastSales - lastPurchases - lastSalaries - lastExpenses;

  const todaySaleLines = await prisma.saleLine.findMany({
    where: { sale: { restaurantId, date: { gte: todayStart, lte: todayEnd } } },
    include: { menuItem: true },
  });
  const soldMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const line of todaySaleLines) {
    const existing = soldMap.get(line.menuItemId) ?? {
      name: line.menuItem.name,
      quantity: 0,
      revenue: 0,
    };
    existing.quantity += line.quantity;
    existing.revenue += line.amount;
    soldMap.set(line.menuItemId, existing);
  }
  const topSoldFood =
    [...soldMap.values()].sort((a, b) => b.quantity - a.quantity)[0] ?? null;

  const monthLines = await prisma.purchaseLine.findMany({
    where: { purchase: { restaurantId, date: { gte: monthStart, lte: monthEnd } } },
    include: { item: { include: { category: true } } },
  });
  const costMap = new Map<string, { name: string; amount: number }>();
  let totalPurchaseSpend = 0;
  for (const line of monthLines) {
    totalPurchaseSpend += line.amount;
    const existing = costMap.get(line.itemId) ?? { name: line.item.name, amount: 0 };
    existing.amount += line.amount;
    costMap.set(line.itemId, existing);
  }
  const sortedCosts = [...costMap.values()].sort((a, b) => b.amount - a.amount);
  const majorCosts = sortedCosts.slice(0, 5).map((c) => ({
    name: c.name,
    amount: c.amount,
    percent:
      totalPurchaseSpend === 0 ? 0 : Math.round((c.amount / totalPurchaseSpend) * 1000) / 10,
  }));

  return {
    restaurantName: restaurant.name,
    billCountToday,
    employeeCount,
    today: {
      sales: todaySales,
      purchases: todayPurchases,
      foodPurchases: todayFood,
      salaries: todaySalaries,
      otherExpenses: todayExpenses,
      profit: todayProfit,
      topSoldFood,
    },
    month: {
      sales: monthSales,
      purchases: monthPurchases,
      salaries: monthSalaries,
      otherExpenses: monthExpenses,
      profit: monthProfit,
    },
    lastMonth: {
      sales: lastSales,
      purchases: lastPurchases,
      profit: lastProfit,
    },
    topCostItem: sortedCosts[0] ?? null,
    majorCosts,
  };
}

export async function getPlatformStats() {
  const [restaurants, users, employees, salesTotal] = await Promise.all([
    prisma.restaurant.count(),
    prisma.user.count(),
    prisma.employee.count(),
    prisma.sale.aggregate({ _sum: { totalAmount: true } }),
  ]);
  return {
    restaurants,
    users,
    employees,
    salesTotal: salesTotal._sum.totalAmount ?? 0,
  };
}
