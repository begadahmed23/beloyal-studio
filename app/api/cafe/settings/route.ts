import { dashboardPaletteSelect } from "@/lib/business/dashboard-palette";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

import { serializeCafeSettings } from "./serializer";
import { scheduleGoogleWalletBrandUpdate } from "@/lib/wallet/google";
import { updateCafeSettings } from "./update-settings";

export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (
      !authData ||
      authData.isSuperAdmin ||
      authData.isCashier ||
      !authData.cafeId
    ) {
      return NextResponse.json(
        {
          error: "You are not authorized to access business settings.",
        },
        {
          status: 403,
        },
      );
    }

    const cafe = await prisma.cafe.findUnique({
      where: {
        id: authData.cafeId,
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
        ...dashboardPaletteSelect,

        rewardTarget: true,
        rewardName: true,
        rewardDescription: true,
        eligiblePurchaseDescription: true,
        minimumPurchaseAmount: true,

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

    if (!cafe) {
      return NextResponse.json(
        {
          error: "Business not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      cafe: serializeCafeSettings(cafe),
      accountEmail: authData.user.email,
    });
  } catch (error) {
    console.error("GET business settings error:", error);

    return NextResponse.json(
      {
        error: "Unable to load business settings.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (
      !authData ||
      authData.isSuperAdmin ||
      authData.isCashier ||
      !authData.cafeId
    ) {
      return NextResponse.json(
        {
          error: "You are not authorized to update business settings.",
        },
        {
          status: 403,
        },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          error: "Invalid settings data.",
        },
        {
          status: 400,
        },
      );
    }

    const settings = body as Record<string, unknown>;
    const cafe = await updateCafeSettings(authData.cafeId, settings);

    if (settings.section === undefined || settings.section === "general") {
      scheduleGoogleWalletBrandUpdate(cafe);
    }

    return NextResponse.json({
      message: "Settings saved successfully.",
      cafe: serializeCafeSettings(cafe),
    });
  } catch (error) {
    console.error("PATCH business settings error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save business settings.",
      },
      {
        status: 400,
      },
    );
  }
}
