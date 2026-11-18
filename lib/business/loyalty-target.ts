type LoyaltyBusiness = {
  rewardTarget: number;
  businessType?: "CAFE" | "BARBERSHOP";
};

// The configured visit is the redemption visit. Legacy targets of 1 still require one paid visit.
export function getLoyaltyProgressTarget({ rewardTarget }: LoyaltyBusiness) {
  return Math.max(rewardTarget - 1, 1);
}
