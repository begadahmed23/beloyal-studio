import { dashboardPaletteUpdate, dashboardPaletteSelect } from "@/lib/business/dashboard-palette";
import { getDashboardThemeColors, isRestaurantPalette } from "@/lib/cafe-theme";
import { prisma } from "@/lib/prisma";

import { validateCafeSettingsPatch } from "./validation";

export async function updateCafeSettings(
  cafeId: string,
  body: Record<string, unknown>,
) {
  const { theme, primaryColor, secondaryColor, backgroundColor, ...settings } = validateCafeSettingsPatch(body);

  const restaurantColors = isRestaurantPalette(theme) ? getDashboardThemeColors(theme) : null;
  const cafe = await prisma.cafe.update({
    where: {
      id: cafeId,
      ...(restaurantColors && { businessType: "RESTAURANT" }),
    },
    data: {
      ...settings, ...dashboardPaletteUpdate({ theme, primaryColor, secondaryColor, backgroundColor }),
      ...(restaurantColors && isRestaurantPalette(theme) && {
        theme, primaryColor: restaurantColors[0], secondaryColor: restaurantColors[1], backgroundColor: restaurantColors[2],
      }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      loyaltyMode: true,
      restaurantCategory: true,
      updatedAt: true,
      logoUrl: true,
      theme: true,

      primaryColor: true,
      secondaryColor: true,
      backgroundColor: true,
      ...dashboardPaletteSelect,

      rewardTarget: true,
      rewardName: true,
      rewardDescription: true,
      eligiblePurchaseDescription: true,
      minimumPurchaseAmount: true,
      spendingTrackingEnabled: true,

      feedbackEnabled: true,
      feedbackRewardEnabled: true,
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
