import { CafeTheme, Prisma, SubscriptionStatus } from "@prisma/client";

export type CafeSettingsRecord = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: CafeTheme;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
  minimumPurchaseAmount: Prisma.Decimal | null;

  whatsappBusinessNumber: string | null;
  whatsappEnabled: boolean;

  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  subscriptionStartedAt: Date | null;
  subscriptionEndsAt: Date | null;
  monthlyPrice: Prisma.Decimal | null;

  isActive: boolean;
};

export function serializeCafeSettings(cafe: CafeSettingsRecord) {
  return {
    ...cafe,

    minimumPurchaseAmount: cafe.minimumPurchaseAmount?.toString() ?? null,

    monthlyPrice: cafe.monthlyPrice?.toString() ?? null,

    trialStartedAt: cafe.trialStartedAt?.toISOString() ?? null,

    trialEndsAt: cafe.trialEndsAt?.toISOString() ?? null,

    subscriptionStartedAt: cafe.subscriptionStartedAt?.toISOString() ?? null,

    subscriptionEndsAt: cafe.subscriptionEndsAt?.toISOString() ?? null,
  };
}
