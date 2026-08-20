import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSale, SaleValidationError } from "@/lib/sales";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const sales = await prisma.sale.findMany({
      where: { restaurantId },
      take: limit,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { lines: { include: { menuItem: true } } },
    });
    return NextResponse.json(sales);
  } catch (err) {
    return authErrorResponse(err);
  }
}

type LineInput = { menuItemId: string; quantity: number; unitPrice?: number };

export async function POST(request: NextRequest) {
  try {
    const { user, restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const lines: LineInput[] = body.lines ?? [];

    const sale = await createSale({
      restaurantId,
      createdById: user.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      lines,
      notes: body.notes || null,
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    if (err instanceof SaleValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
