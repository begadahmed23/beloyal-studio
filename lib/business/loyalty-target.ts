import type { BusinessType } from "@prisma/client";
type LoyaltyBusiness = {
  rewardTarget: number;
  businessType?: BusinessType;
};

// The configured visit is the redemption visit. Legacy targets of 1 still require one paid visit.
export function getLoyaltyProgressTarget({ rewardTarget }: LoyaltyBusiness) {
  return Math.max(rewardTarget - 1, 1);
}
