import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireAuth, setActiveRestaurantOnSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["RESTAURANT_ADMIN"]);
    const { restaurantId } = await request.json();

    if (!restaurantId || typeof restaurantId !== "string") {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    if (!user.restaurantIds.includes(restaurantId)) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    await setActiveRestaurantOnSession(restaurantId);

    return NextResponse.json({ ok: true, activeRestaurantId: restaurantId });
  } catch (err) {
    return authErrorResponse(err);
  }
}
