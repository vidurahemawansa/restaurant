-- Step 1: Create category table and add new columns (keep legacy category/unit during backfill)

CREATE TABLE "PurchaseItemCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseItemCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PurchaseItemCategory_restaurantId_name_key" ON "PurchaseItemCategory"("restaurantId", "name");
CREATE INDEX "PurchaseItemCategory_restaurantId_idx" ON "PurchaseItemCategory"("restaurantId");
CREATE INDEX "PurchaseItemCategory_restaurantId_active_idx" ON "PurchaseItemCategory"("restaurantId", "active");

ALTER TABLE "PurchaseItem" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN "defaultUnit" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN "defaultSupplierId" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN "lastPurchasePrice" REAL;

CREATE INDEX "PurchaseItem_restaurantId_active_idx" ON "PurchaseItem"("restaurantId", "active");
CREATE INDEX "PurchaseItem_categoryId_idx" ON "PurchaseItem"("categoryId");
CREATE INDEX "PurchaseItem_name_idx" ON "PurchaseItem"("name");
