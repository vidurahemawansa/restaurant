-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "shortName" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "ticketNumber" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN "orderType" TEXT NOT NULL DEFAULT 'Takeaway';
ALTER TABLE "Sale" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'CLOSED';
ALTER TABLE "Sale" ADD COLUMN "closedAt" DATETIME;

-- Backfill sequential ticket numbers per restaurant
UPDATE "Sale"
SET "ticketNumber" = (
  SELECT COUNT(*)
  FROM "Sale" AS "s2"
  WHERE "s2"."restaurantId" = "Sale"."restaurantId"
    AND (
      "s2"."createdAt" < "Sale"."createdAt"
      OR ("s2"."createdAt" = "Sale"."createdAt" AND "s2"."id" <= "Sale"."id")
    )
);

UPDATE "Sale"
SET "closedAt" = COALESCE("closedAt", "date")
WHERE "status" = 'CLOSED' AND "closedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_restaurantId_ticketNumber_key" ON "Sale"("restaurantId", "ticketNumber");
CREATE INDEX "Sale_restaurantId_status_idx" ON "Sale"("restaurantId", "status");
