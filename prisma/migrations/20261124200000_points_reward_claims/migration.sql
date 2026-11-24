-- CreateTable
CREATE TABLE "PointsRewardClaim" (
    "cafeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "cost" DECIMAL(18,6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "PointsRewardClaim_pkey" PRIMARY KEY ("cafeId","customerId","rewardId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PointsRewardClaim_code_key" ON "PointsRewardClaim"("code");

-- AddForeignKey
ALTER TABLE "PointsRewardClaim" ADD CONSTRAINT "PointsRewardClaim_cafeId_customerId_fkey" FOREIGN KEY ("cafeId", "customerId") REFERENCES "Customer"("cafeId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsRewardClaim" ADD CONSTRAINT "PointsRewardClaim_cafeId_rewardId_fkey" FOREIGN KEY ("cafeId", "rewardId") REFERENCES "PointsReward"("cafeId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
