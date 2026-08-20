import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractBillFromImage } from "@/lib/bills/extract";
import { BillImageError } from "@/lib/bills/image";
import type { MenuRef } from "@/lib/bills/types";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const clientMime = file.type || null;

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, price: true, category: true },
    });

    if (!menuItems.length) {
      return NextResponse.json(
        { error: "No menu items configured. Add menu items first." },
        { status: 400 }
      );
    }

    const menu: MenuRef[] = menuItems;
    const result = await extractBillFromImage(buffer, menu, clientMime);

    return NextResponse.json({ ...result, menu: menuItems });
  } catch (err) {
    if (err instanceof BillImageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Bill scan failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    if (!(err instanceof Error && "status" in err)) {
      return NextResponse.json({ error: message }, { status });
    }
    return authErrorResponse(err);
  }
}
