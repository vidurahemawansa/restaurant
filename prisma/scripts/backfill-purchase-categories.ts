/**
 * Backfill PurchaseItemCategory and map PurchaseItem.category → categoryId.
 * Run once after applying migration 20260820200000_purchase_item_categories (step 1).
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../src/generated/prisma/client";
import path from "path";
import {
  DEFAULT_PURCHASE_CATEGORIES,
  LEGACY_CATEGORY_MAP,
  seedPurchaseCategories,
} from "../../src/lib/purchase-categories";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true } });

  for (const { id: restaurantId } of restaurants) {
    const categories = await seedPurchaseCategories(restaurantId, prisma);
    const byName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

    type LegacyRow = { id: string; category: string; unit: string | null };
    const legacyItems = await prisma.$queryRawUnsafe<LegacyRow[]>(
      `SELECT id, category, unit FROM PurchaseItem WHERE restaurantId = ?`,
      restaurantId
    );

    for (const row of legacyItems) {
      const mapped = LEGACY_CATEGORY_MAP[row.category] ?? row.category;
      const categoryId =
        byName[mapped] ??
        byName[
          DEFAULT_PURCHASE_CATEGORIES.includes(
            mapped as (typeof DEFAULT_PURCHASE_CATEGORIES)[number]
          )
            ? mapped
            : "Other"
        ];

      await prisma.$executeRawUnsafe(
        `UPDATE PurchaseItem SET categoryId = ?, defaultUnit = COALESCE(defaultUnit, ?) WHERE id = ?`,
        categoryId,
        row.unit,
        row.id
      );
    }
  }

  console.log("Backfill complete for", restaurants.length, "restaurant(s)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
