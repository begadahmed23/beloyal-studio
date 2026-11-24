import { getRewardName } from "@/lib/business/terminology";
import { dashboardPaletteSelect } from "@/lib/business/dashboard-palette";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAuth(
  requestHeaders: Headers
) {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    return null;
  }

  const record = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cafeId: true,
      cashierCafeId: true,
      cashierLocationId: true,
      cashierLocation: { select: { archivedAt: true } },
      staffCafeId: true,
      isEnabled: true,

      cafe: {
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          loyaltyMode: true,
          restaurantCategory: true,
          pointsPerHundred: true,
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

          isActive: true,

          subscriptionStatus: true,
          trialStartedAt: true,
          trialEndsAt: true,
          subscriptionStartedAt: true,
          subscriptionEndsAt: true,
          lastPaymentAt: true,
          nextReminderAt: true,
          reminderSentAt: true,
          monthlyPrice: true,
        },
      },

      cashierCafe: {
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          loyaltyMode: true,
          restaurantCategory: true,
          pointsPerHundred: true,
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

          isActive: true,

          subscriptionStatus: true,
          trialStartedAt: true,
          trialEndsAt: true,
          subscriptionStartedAt: true,
          subscriptionEndsAt: true,
          lastPaymentAt: true,
          nextReminderAt: true,
          reminderSentAt: true,
          monthlyPrice: true,
        },
      },

      staffCafe: {
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          loyaltyMode: true,
          restaurantCategory: true,
          pointsPerHundred: true,
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

          isActive: true,

          subscriptionStatus: true,
          trialStartedAt: true,
          trialEndsAt: true,
          subscriptionStartedAt: true,
          subscriptionEndsAt: true,
          lastPaymentAt: true,
          nextReminderAt: true,
          reminderSentAt: true,
          monthlyPrice: true,
        },
      },
    },
  });

  if (!record || !record.isEnabled) {
    return null;
  }
  const { cashierLocation, ...user } = record;
  if (cashierLocation?.archivedAt) user.cashierLocationId = null;

  if (user.role === "SUPER_ADMIN") {
    return {
      session,
      user,
      cafe: null,
      cafeId: null,
      isSuperAdmin: true,
      isCashier: false,
    };
  }

  if (user.staffCafeId && user.staffCafe) {
    return {
      session,
      user,
      cafe: { ...user.staffCafe, rewardName: getRewardName(user.staffCafe) },
      cafeId: user.staffCafeId,
      isSuperAdmin: false,
      isCashier: user.role === "CASHIER",
    };
  }

  if (user.role === "CASHIER") {
    if (!user.cashierCafeId || !user.cashierCafe) {
      return null;
    }

    return {
      session,
      user,
      cafe: { ...user.cashierCafe, rewardName: getRewardName(user.cashierCafe) },
      cafeId: user.cashierCafeId,
      isSuperAdmin: false,
      isCashier: true,
    };
  }

  if (!user.cafeId || !user.cafe) {
    return null;
  }

  return {
    session,
    user,
    cafe: { ...user.cafe, rewardName: getRewardName(user.cafe) },
    cafeId: user.cafeId,
    isSuperAdmin: false,
    isCashier: false,
  };
}
