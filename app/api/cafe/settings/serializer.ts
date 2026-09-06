import {
  BusinessType,
  CafeTheme,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

export type CafeSettingsRecord = {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  logoUrl: string | null;
  theme: CafeTheme;

  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
  minimumPurchaseAmount: Prisma.Decimal | null;

  googleReviewUrl: string | null;

  timezone: string;
  birthdayRewardsEnabled: boolean;
  birthdayRewardName: string | null;
  birthdayRewardDescription: string | null;
  birthdayPurchaseRequirement: string | null;
  birthdayValidityDays: number;
  birthdayReminderEnabled: boolean;
  birthdayReminderDaysBefore: number;
  birthdayDayMessageEnabled: boolean;
  birthdayFriendDiscountEnabled: boolean;
  birthdayOneFriendDiscount: number;
  birthdayGroupDiscount: number;

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
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    businessType: cafe.businessType,
    logoUrl: cafe.logoUrl,
    theme: cafe.theme,

    primaryColor: cafe.primaryColor,
    secondaryColor: cafe.secondaryColor,
    backgroundColor: cafe.backgroundColor,

    rewardTarget: cafe.rewardTarget,
    rewardName: cafe.rewardName,
    rewardDescription: cafe.rewardDescription,
    eligiblePurchaseDescription:
      cafe.eligiblePurchaseDescription,

    minimumPurchaseAmount:
      cafe.minimumPurchaseAmount?.toString() ?? null,

    googleReviewUrl: cafe.googleReviewUrl,

    timezone: cafe.timezone,
    birthdayRewardsEnabled: cafe.birthdayRewardsEnabled,
    birthdayRewardName: cafe.birthdayRewardName,
    birthdayRewardDescription:
      cafe.birthdayRewardDescription,
    birthdayPurchaseRequirement:
      cafe.birthdayPurchaseRequirement,
    birthdayValidityDays: cafe.birthdayValidityDays,
    birthdayReminderEnabled:
      cafe.birthdayReminderEnabled,
    birthdayReminderDaysBefore:
      cafe.birthdayReminderDaysBefore,
    birthdayDayMessageEnabled:
      cafe.birthdayDayMessageEnabled,
    birthdayFriendDiscountEnabled:
      cafe.birthdayFriendDiscountEnabled,
    birthdayOneFriendDiscount:
      cafe.birthdayOneFriendDiscount,
    birthdayGroupDiscount:
      cafe.birthdayGroupDiscount,

    subscriptionStatus: cafe.subscriptionStatus,

    trialStartedAt:
      cafe.trialStartedAt?.toISOString() ?? null,

    trialEndsAt:
      cafe.trialEndsAt?.toISOString() ?? null,

    subscriptionStartedAt:
      cafe.subscriptionStartedAt?.toISOString() ?? null,

    subscriptionEndsAt:
      cafe.subscriptionEndsAt?.toISOString() ?? null,

    monthlyPrice:
      cafe.monthlyPrice?.toString() ?? null,

    isActive: cafe.isActive,
  };
}
