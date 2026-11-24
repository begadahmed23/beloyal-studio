-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LoyaltyMode" AS ENUM ('STAMPS', 'POINTS');

-- CreateEnum
CREATE TYPE "RestaurantCategory" AS ENUM ('SUSHI', 'PIZZA', 'FRIED_CHICKEN', 'BURGER', 'HEALTHY_FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "PointsTransactionKind" AS ENUM ('PURCHASE', 'REDEMPTION', 'REFUND');

-- AlterEnum
ALTER TYPE "BusinessType" ADD VALUE 'RESTAURANT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CafeTheme" ADD VALUE 'RED_ORANGE_LIGHT';
ALTER TYPE "CafeTheme" ADD VALUE 'RED_ORANGE_DARK';

-- AlterTable
ALTER TABLE "Cafe" ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "loyaltyMode" "LoyaltyMode" NOT NULL DEFAULT 'STAMPS',
ADD COLUMN     "pointsPerHundred" DECIMAL(10,4) NOT NULL DEFAULT 10,
ADD COLUMN     "proposedBillingPeriod" "BillingPeriod",
ADD COLUMN     "restaurantCategory" "RestaurantCategory";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "pointsBalance" DECIMAL(18,6) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PointsReward" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditions" TEXT,
    "photoUrl" TEXT,
    "cost" DECIMAL(18,6) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsRewardLocation" (
    "cafeId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "PointsRewardLocation_pkey" PRIMARY KEY ("cafeId","rewardId","locationId")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "kind" "PointsTransactionKind" NOT NULL,
    "delta" DECIMAL(18,6) NOT NULL,
    "balanceAfter" DECIMAL(18,6) NOT NULL,
    "amount" DECIMAL(12,2),
    "pointsPerHundred" DECIMAL(10,4),
    "receipt" TEXT,
    "rewardId" TEXT,
    "rewardName" TEXT,
    "rewardSnapshot" JSONB,
    "purchaseId" TEXT,
    "reason" TEXT,
    "requestId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsReward_cafeId_archivedAt_idx" ON "PointsReward"("cafeId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PointsReward_cafeId_id_key" ON "PointsReward"("cafeId", "id");

-- CreateIndex
CREATE INDEX "PointsTransaction_cafeId_customerId_createdAt_idx" ON "PointsTransaction"("cafeId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_cafeId_createdAt_idx" ON "PointsTransaction"("cafeId", "createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_cafeId_purchaseId_idx" ON "PointsTransaction"("cafeId", "purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsTransaction_cafeId_id_key" ON "PointsTransaction"("cafeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PointsTransaction_cafeId_requestId_key" ON "PointsTransaction"("cafeId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsTransaction_cafeId_locationId_receipt_key" ON "PointsTransaction"("cafeId", "locationId", "receipt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cafeId_id_key" ON "Customer"("cafeId", "id");

-- AddForeignKey
ALTER TABLE "PointsReward" ADD CONSTRAINT "PointsReward_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsRewardLocation" ADD CONSTRAINT "PointsRewardLocation_cafeId_rewardId_fkey" FOREIGN KEY ("cafeId", "rewardId") REFERENCES "PointsReward"("cafeId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsRewardLocation" ADD CONSTRAINT "PointsRewardLocation_cafeId_locationId_fkey" FOREIGN KEY ("cafeId", "locationId") REFERENCES "CafeLocation"("cafeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_cafeId_customerId_fkey" FOREIGN KEY ("cafeId", "customerId") REFERENCES "Customer"("cafeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_cafeId_locationId_fkey" FOREIGN KEY ("cafeId", "locationId") REFERENCES "CafeLocation"("cafeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_cafeId_rewardId_fkey" FOREIGN KEY ("cafeId", "rewardId") REFERENCES "PointsReward"("cafeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_cafeId_purchaseId_fkey" FOREIGN KEY ("cafeId", "purchaseId") REFERENCES "PointsTransaction"("cafeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Cafe" ADD CONSTRAINT "Cafe_pointsPerHundred_positive" CHECK ("pointsPerHundred" > 0);
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_pointsBalance_nonnegative" CHECK ("pointsBalance" >= 0);
ALTER TABLE "PointsReward" ADD CONSTRAINT "PointsReward_cost_positive" CHECK ("cost" > 0);
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_balance_nonnegative" CHECK ("balanceAfter" >= 0);
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_kind_consistency" CHECK (
  (kind = 'PURCHASE' AND delta >= 0 AND amount > 0 AND "pointsPerHundred" > 0 AND "purchaseId" IS NULL AND "rewardId" IS NULL)
  OR (kind = 'REDEMPTION' AND delta < 0 AND amount IS NULL AND "purchaseId" IS NULL AND "rewardId" IS NOT NULL)
  OR (kind = 'REFUND' AND delta <= 0 AND amount > 0 AND "purchaseId" IS NOT NULL AND "rewardId" IS NULL AND reason IS NOT NULL)
);
