type LoyaltyBusiness = {
  businessType: "CAFE" | "BARBERSHOP";
  rewardTarget: number;
};

/**
 * Café accounts keep the existing "buy N-1, next one free" rule.
 * Barbershop rewardTarget is the exact number of paid visits shown
 * on the visit card before the free haircut is ready.
 */
export function getLoyaltyProgressTarget({
  businessType,
  rewardTarget,
}: LoyaltyBusiness) {
  const safeTarget = Math.max(rewardTarget, 1);

  return businessType === "BARBERSHOP"
    ? safeTarget
    : Math.max(safeTarget - 1, 1);
}
