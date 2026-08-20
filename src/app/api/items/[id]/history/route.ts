import { NextResponse } from "next/server";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { getPurchaseItemHistory } from "@/lib/purchase-items.server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const { id } = await params;
    const history = await getPurchaseItemHistory(restaurantId, id);
    if (!history) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(history);
  } catch (err) {
    return authErrorResponse(err);
  }
}
