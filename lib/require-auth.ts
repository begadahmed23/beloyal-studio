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

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cafeId: true,

      cafe: {
        select: {
          id: true,
          name: true,
          slug: true,
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

          whatsappBusinessNumber: true,
          whatsappEnabled: true,

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

  if (!user) {
    return null;
  }

  if (user.role === "SUPER_ADMIN") {
    return {
      session,
      user,
      cafe: null,
      cafeId: null,
      isSuperAdmin: true,
    };
  }

  if (!user.cafeId || !user.cafe) {
    return null;
  }

  return {
    session,
    user,
    cafe: user.cafe,
    cafeId: user.cafeId,
    isSuperAdmin: false,
  };
}