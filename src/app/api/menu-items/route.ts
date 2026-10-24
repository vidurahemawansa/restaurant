import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const items = await prisma.menuItem.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const price = Number(body.price);
    if (!name || !(price >= 0)) {
      return NextResponse.json({ error: "Name and price required" }, { status: 400 });
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        price,
        category: body.category || null,
        shortName: body.shortName?.trim() || null,
        sortOrder: Number(body.sortOrder ?? 50),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
