import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

import { serializeCafeSettings } from "./serializer";
import { updateCafeSettings } from "./update-settings";

export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (!authData || authData.isSuperAdmin || !authData.cafeId) {
      return NextResponse.json(
        {
          error: "You are not authorized to access café settings.",
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
        logoUrl: true,
        theme: true,

        rewardTarget: true,
        rewardName: true,
        rewardDescription: true,
        eligiblePurchaseDescription: true,
        minimumPurchaseAmount: true,

        whatsappBusinessNumber: true,
        whatsappEnabled: true,

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
          error: "Café not found.",
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
    console.error("GET café settings error:", error);

    return NextResponse.json(
      {
        error: "Unable to load café settings.",
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

    if (!authData || authData.isSuperAdmin || !authData.cafeId) {
      return NextResponse.json(
        {
          error: "You are not authorized to update café settings.",
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

    const cafe = await updateCafeSettings(
      authData.cafeId,
      body as Record<string, unknown>,
    );

    return NextResponse.json({
      message: "Settings saved successfully.",
      cafe: serializeCafeSettings(cafe),
    });
  } catch (error) {
    console.error("PATCH café settings error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save café settings.",
      },
      {
        status: 400,
      },
    );
  }
}
