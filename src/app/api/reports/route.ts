import { NextRequest, NextResponse } from "next/server";
import { getMajorCostAnalysis, getCostTrend } from "@/lib/reports";
import { parseDateInput, startOfMonth, endOfMonth } from "@/lib/utils";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const sp = request.nextUrl.searchParams;
    const type = sp.get("type") ?? "major";

    if (type === "trend") {
      const itemId = sp.get("itemId");
      if (!itemId) {
        return NextResponse.json({ error: "itemId required" }, { status: 400 });
      }
      const item = await prisma.purchaseItem.findFirst({
        where: { id: itemId, restaurantId },
      });
      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      const granularity = (sp.get("granularity") ?? "monthly") as
        | "daily"
        | "weekly"
        | "monthly";
      const from = sp.get("from")
        ? parseDateInput(sp.get("from")!)
        : startOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1));
      const to = sp.get("to") ? parseDateInput(sp.get("to")!) : endOfMonth(new Date());
      const points = await getCostTrend(restaurantId, itemId, from, to, granularity);
      return NextResponse.json({ points });
    }

    const from = sp.get("from")
      ? parseDateInput(sp.get("from")!)
      : startOfMonth(new Date());
    const to = sp.get("to") ? parseDateInput(sp.get("to")!) : endOfMonth(new Date());
    const analysis = await getMajorCostAnalysis(restaurantId, from, to);
    return NextResponse.json(analysis);
  } catch (err) {
    return authErrorResponse(err);
  }
}
