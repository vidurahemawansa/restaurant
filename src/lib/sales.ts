import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export type SaleLineInput = {
  menuItemId: string;
  quantity: number;
  unitPrice?: number;
};

export type CreateSaleInput = {
  restaurantId: string;
  createdById?: string | null;
  date: string | Date;
  lines: SaleLineInput[];
  notes?: string | null;
};

export type ValidatedSaleLine = {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export async function createSale(input: CreateSaleInput) {
  const date =
    typeof input.date === "string" ? parseDateInput(input.date) : input.date;
  const lines = input.lines ?? [];

  if (!lines.length) {
    throw new SaleValidationError("Enter at least one line item");
  }

  const menuIds = [...new Set(lines.map((l) => l.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuIds }, restaurantId: input.restaurantId, active: true },
  });
  const priceMap = new Map(menuItems.map((m) => [m.id, m]));

  const saleLines: ValidatedSaleLine[] = [];

  for (const line of lines) {
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new SaleValidationError("Quantity must be greater than 0 for every item");
    }

    const menu = priceMap.get(line.menuItemId);
    if (!menu) {
      throw new SaleValidationError("One or more items are not in the menu");
    }

    const unitPrice =
      line.unitPrice != null && Number(line.unitPrice) >= 0
        ? Number(line.unitPrice)
        : menu.price;

    saleLines.push({
      menuItemId: menu.id,
      quantity: Math.round(qty),
      unitPrice,
      amount: Math.round(qty) * unitPrice,
    });
  }

  const totalAmount = saleLines.reduce((sum, l) => sum + l.amount, 0);

  return prisma.sale.create({
    data: {
      restaurantId: input.restaurantId,
      createdById: input.createdById ?? null,
      date,
      totalAmount,
      notes: input.notes || null,
      lines: { create: saleLines },
    },
    include: { lines: { include: { menuItem: true } } },
  });
}

export class SaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaleValidationError";
  }
}
