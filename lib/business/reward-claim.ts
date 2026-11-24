export const rewardClaimLifetimeMs = 5 * 60 * 1000;

export function rewardClaimStatus(claim: { expiresAt: Date; consumedAt: Date | null }, now = new Date()) {
  if (claim.consumedAt) return "redeemed";
  return claim.expiresAt <= now ? "expired" : "active";
}
