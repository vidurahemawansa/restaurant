import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "30");
    const expenses = await prisma.expense.findMany({
      where: { restaurantId },
      take: limit,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(expenses);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const amount = Number(body.amount);
    if (!(amount > 0) || !body.category) {
      return NextResponse.json({ error: "Category and amount required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        restaurantId,
        date: parseDateInput(body.date ?? new Date().toISOString().slice(0, 10)),
        category: body.category,
        description: body.description || null,
        amount,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
