-- AlterTable Session: add activeRestaurantId
ALTER TABLE "Session" ADD COLUMN "activeRestaurantId" TEXT;

-- RedefineTables Restaurant with onboarding fields
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "openingTime" TEXT,
    "closingTime" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "taxRate" REAL,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("id", "name", "address", "phone", "logoUrl", "status", "createdAt", "updatedAt", "currency", "deliveryEnabled")
SELECT "id", "name", "address", "phone", "logoUrl", "status", "createdAt", "updatedAt", 'LKR', false FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
