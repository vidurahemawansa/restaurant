-- Step 2: Finalize PurchaseItem schema (run after backfill script)

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PurchaseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultUnit" TEXT,
    "defaultSupplierId" TEXT,
    "lastPurchasePrice" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PurchaseItemCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_defaultSupplierId_fkey" FOREIGN KEY ("defaultSupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_PurchaseItem" (
    "id", "restaurantId", "categoryId", "name", "defaultUnit", "defaultSupplierId",
    "lastPurchasePrice", "active", "sortOrder", "useCount", "lastUsedAt", "createdAt", "updatedAt"
)
SELECT
    "id", "restaurantId", "categoryId", "name", "defaultUnit", "defaultSupplierId",
    "lastPurchasePrice", "active", "sortOrder", "useCount", "lastUsedAt", "createdAt", "updatedAt"
FROM "PurchaseItem"
WHERE "categoryId" IS NOT NULL;

DROP TABLE "PurchaseItem";
ALTER TABLE "new_PurchaseItem" RENAME TO "PurchaseItem";

CREATE UNIQUE INDEX "PurchaseItem_restaurantId_name_key" ON "PurchaseItem"("restaurantId", "name");
CREATE INDEX "PurchaseItem_restaurantId_idx" ON "PurchaseItem"("restaurantId");
CREATE INDEX "PurchaseItem_restaurantId_active_idx" ON "PurchaseItem"("restaurantId", "active");
CREATE INDEX "PurchaseItem_categoryId_idx" ON "PurchaseItem"("categoryId");
CREATE INDEX "PurchaseItem_name_idx" ON "PurchaseItem"("name");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
