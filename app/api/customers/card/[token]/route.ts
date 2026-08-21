import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  applyPublicRateLimit,
  publicApiRateLimiters,
} from "@/lib/public-api-security";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

const tokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{48}$/i);

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    /*
     * Apply one IP-based limit for this endpoint.
     * Do not use the supplied token as the scope because an
     * attacker could continually change tokens to bypass it.
     */
    const rateLimitResponse = await applyPublicRateLimit(
      request,
      publicApiRateLimiters.card,
      "public-card",
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { token } = await context.params;
    const tokenResult = tokenSchema.safeParse(token);

    if (!tokenResult.success) {
      return jsonResponse(
        {
          message: "Loyalty card not found.",
        },
        404,
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        publicToken: tokenResult.data,

        cafe: {
          isActive: true,
        },
      },

      select: {
        id: true,
        memberNumber: true,
        publicToken: true,
        name: true,
        birthday: true,
        stamps: true,

        /*
         * Tracks whether the customer already received
         * their one-time feedback bonus.
         */
        feedbackRewardedAt: true,

        /*
         * Tracks whether a loyalty reward has already been
         * earned and must remain available until redemption,
         * even if the café later changes its reward target.
         */
        rewardEarnedAt: true,

        createdAt: true,
        updatedAt: true,

        cafe: {
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
            googleReviewUrl: true,
          },
        },
      },
    });

    if (!customer || !customer.cafe) {
      return jsonResponse(
        {
          message: "Loyalty card not found.",
        },
        404,
      );
    }

    return jsonResponse({
      id: customer.id,
      memberNumber: customer.memberNumber,
      publicToken: customer.publicToken,
      name: customer.name,
      birthday: customer.birthday,
      stamps: customer.stamps,

      feedbackRewardedAt:
        customer.feedbackRewardedAt,

      rewardEarnedAt:
        customer.rewardEarnedAt,

      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,

      cafe: customer.cafe,
    });
  } catch (error) {
    console.error("Public card error:", error);

    return jsonResponse(
      {
        message: "Failed to load loyalty card.",
      },
      500,
    );
  }
}
