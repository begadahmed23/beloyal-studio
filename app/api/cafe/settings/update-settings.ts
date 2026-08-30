import { prisma } from "@/lib/prisma";

import { validateCafeSettings } from "./validation";

export async function updateCafeSettings(
  cafeId: string,
  body: Record<string, unknown>,
) {
  const settings = validateCafeSettings(body);

  const cafe = await prisma.cafe.update({
    where: {
      id: cafeId,
    },
    data: {
      name: settings.name,
      logoUrl: settings.logoUrl,
      theme: settings.theme,

      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,

      rewardTarget: settings.rewardTarget,
      rewardName: settings.rewardName,
      rewardDescription: settings.rewardDescription,
      eligiblePurchaseDescription:
        settings.eligiblePurchaseDescription,

      minimumPurchaseAmount:
        settings.minimumPurchaseAmount,

      googleReviewUrl: settings.googleReviewUrl,

      timezone: settings.timezone,

      birthdayRewardsEnabled:
        settings.birthdayRewardsEnabled,
      birthdayRewardName:
        settings.birthdayRewardName,
      birthdayRewardDescription:
        settings.birthdayRewardDescription,
      birthdayPurchaseRequirement:
        settings.birthdayPurchaseRequirement,
      birthdayValidityDays:
        settings.birthdayValidityDays,
      birthdayReminderEnabled:
        settings.birthdayReminderEnabled,
      birthdayReminderDaysBefore:
        settings.birthdayReminderDaysBefore,
      birthdayDayMessageEnabled:
        settings.birthdayDayMessageEnabled,
      birthdayFriendDiscountEnabled:
        settings.birthdayFriendDiscountEnabled,
      birthdayOneFriendDiscount:
        settings.birthdayOneFriendDiscount,
      birthdayGroupDiscount:
        settings.birthdayGroupDiscount,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      logoUrl: true,
      theme: true,

      primaryColor: true,
      secondaryColor: true,
      backgroundColor: true,

      rewardTarget: true,
      rewardName: true,
      rewardDescription: true,
      eligiblePurchaseDescription: true,
      minimumPurchaseAmount: true,

      googleReviewUrl: true,

      timezone: true,
      birthdayRewardsEnabled: true,
      birthdayRewardName: true,
      birthdayRewardDescription: true,
      birthdayPurchaseRequirement: true,
      birthdayValidityDays: true,
      birthdayReminderEnabled: true,
      birthdayReminderDaysBefore: true,
      birthdayDayMessageEnabled: true,
      birthdayFriendDiscountEnabled: true,
      birthdayOneFriendDiscount: true,
      birthdayGroupDiscount: true,

      subscriptionStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
      subscriptionStartedAt: true,
      subscriptionEndsAt: true,
      monthlyPrice: true,

      isActive: true,
    },
  });

  return cafe;
}
