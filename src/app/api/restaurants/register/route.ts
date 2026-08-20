import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireAuth, setActiveRestaurantOnSession } from "@/lib/auth";
import {
  categoryIdFromName,
  seedPurchaseCategories,
} from "@/lib/purchase-categories";

const DEFAULT_PURCHASE_ITEMS = [
  { name: "Chicken", category: "Meat", defaultUnit: "kg", sortOrder: 1 },
  { name: "Rice", category: "Rice & Grains", defaultUnit: "kg", sortOrder: 5 },
  { name: "Fish", category: "Seafood", defaultUnit: "kg", sortOrder: 4 },
  { name: "Vegetables", category: "Vegetables", defaultUnit: "kg", sortOrder: 6 },
  { name: "Prawns", category: "Seafood", defaultUnit: "kg", sortOrder: 3 },
  { name: "Gas", category: "Gas", defaultUnit: "cylinder", sortOrder: 9 },
  { name: "Other", category: "Other", defaultUnit: "pcs", sortOrder: 99 },
];

const DEFAULT_MENU = [
  { name: "Chicken Fried Rice", price: 650, category: "Rice", sortOrder: 1 },
  { name: "Egg Fried Rice", price: 550, category: "Rice", sortOrder: 2 },
  { name: "Chicken Kottu", price: 700, category: "Kottu", sortOrder: 4 },
];

const RESTAURANT_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Fast Food",
  "Bakery",
  "Cloud Kitchen",
  "Bar",
  "Other",
] as const;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["RESTAURANT_ADMIN"]);
    if (user.restaurantIds.length > 0) {
      return NextResponse.json({ error: "You already have a restaurant" }, { status: 409 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Restaurant name required" }, { status: 400 });
    }

    const category = body.category?.trim();
    const taxRate = body.taxRate != null && body.taxRate !== "" ? Number(body.taxRate) : null;

    const restaurant = await prisma.$transaction(
      async (tx) => {
      const r = await tx.restaurant.create({
        data: {
          name,
          address: body.address?.trim() || null,
          phone: body.phone?.trim() || null,
          whatsapp: body.whatsapp?.trim() || null,
          email: body.email?.trim() || null,
          openingTime: body.openingTime?.trim() || null,
          closingTime: body.closingTime?.trim() || null,
          currency: body.currency?.trim() || "LKR",
          taxRate: taxRate != null && !Number.isNaN(taxRate) ? taxRate : null,
          deliveryEnabled: Boolean(body.deliveryEnabled),
          category:
            category && RESTAURANT_CATEGORIES.includes(category as (typeof RESTAURANT_CATEGORIES)[number])
              ? category
              : category || null,
        },
      });

      await tx.restaurantMembership.create({
        data: { userId: user.id, restaurantId: r.id },
      });

      const categories = await seedPurchaseCategories(r.id, tx);
      for (const item of DEFAULT_PURCHASE_ITEMS) {
        const categoryId = categoryIdFromName(item.category, categories);
        await tx.purchaseItem.create({
          data: {
            restaurantId: r.id,
            categoryId,
            name: item.name,
            defaultUnit: item.defaultUnit,
            sortOrder: item.sortOrder,
          },
        });
      }
      for (const item of DEFAULT_MENU) {
        await tx.menuItem.create({ data: { ...item, restaurantId: r.id } });
      }

      return r;
    },
      { timeout: 30_000 }
    );

    await setActiveRestaurantOnSession(restaurant.id);

    return NextResponse.json({ restaurant, redirectTo: "/" }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
