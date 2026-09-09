import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import {
  applyPublicRateLimit,
  publicApiRateLimiters,
} from "@/lib/public-api-security";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

const feedbackSchema = z
  .object({
    comment: z
      .string()
      .trim()
      .min(10, "Please write a little more about your experience.")
      .max(1000, "Feedback must be 1000 characters or less."),
  })
  .strict();

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const rateLimitResponse = await applyPublicRateLimit(
      request,
      publicApiRateLimiters.review,
      "public-feedback",
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { token } = await context.params;

    const cleanToken =
      typeof token === "string"
        ? token.trim()
        : "";

    if (!cleanToken) {
      return jsonResponse(
        {
          error: "Loyalty card token is required.",
        },
        400,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          error: "Invalid request.",
        },
        400,
      );
    }

    const validationResult =
      feedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return jsonResponse(
        {
          error:
            validationResult.error.issues[0]
              ?.message ||
            "Please check your feedback.",
        },
        400,
      );
    }

    const comment =
      validationResult.data.comment;

    const result =
      await prisma.$transaction(
        async (tx) => {
          // Lock the token's customer, then read only that locked row.
          const [lockedCustomer] = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT c."id" FROM "Customer" AS c
            WHERE c."publicToken" = ${cleanToken}
            FOR UPDATE OF c
          `;

          const customer = lockedCustomer
            ? await tx.customer.findUnique({
              where: {
                id: lockedCustomer.id,
              },

              select: {
                id: true,
                cafeId: true,
                stamps: true,
                feedbackRewardedAt: true,
                rewardEarnedAt: true,

                cafe: {
                  select: {
                    isActive: true,
                    businessType: true,
                    feedbackEnabled: true,
                    googleReviewUrl: true,
                    rewardTarget: true,
                  },
                },
              },
            })
            : null;

          if (
            !customer ||
            !customer.cafe.isActive
          ) {
            return {
              type: "not-found" as const,
            };
          }

          const feedbackEnabled =
            customer.cafe.feedbackEnabled ??
            customer.cafe.businessType === "CAFE";

          if (!feedbackEnabled) {
            return {
              type: "disabled" as const,
            };
          }

          /*
           * Always save feedback.
           *
           * Customers may submit as many written
           * feedback notes as they want.
           */
          await tx.customerFeedback.create({
            data: {
              comment,
              customerId: customer.id,
              cafeId: customer.cafeId,
            },
          });

          const paidStampTarget =
            getLoyaltyProgressTarget({
              businessType:
                customer.cafe.businessType,
              rewardTarget:
                customer.cafe.rewardTarget,
            });

          const alreadyReady =
            customer.rewardEarnedAt !== null ||
            customer.stamps >= paidStampTarget;

          /*
           * Claim the one-time feedback stamp, deferring it when a reward is ready.
           *
           * Only a customer whose feedbackRewardedAt
           * is still null can receive this reward.
           */
          const rewardClaim =
            await tx.customer.updateMany({
              where: {
                id: customer.id,
                feedbackRewardedAt: null,
              },

              data: {
                feedbackRewardedAt:
                  new Date(),
                pendingFeedbackBonus: alreadyReady,

                ...(alreadyReady
                  ? {}
                  : { stamps: { increment: 1 } }),
              },
            });

          const rewardGranted =
            rewardClaim.count === 1;

          /*
           * If the feedback bonus was actually granted,
           * also create the matching audit transaction.
           */
          if (rewardGranted) {
            await tx.stampTransaction.create({
              data: {
                type: "ADD",
                description: alreadyReady
                  ? "Feedback bonus saved for next cycle"
                  : "Feedback reward",

                customer: {
                  connect: {
                    id: customer.id,
                  },
                },

                cafe: {
                  connect: {
                    id: customer.cafeId,
                  },
                },
              },
            });
          }

          /*
           * Read the customer's new state after the
           * possible +1 feedback stamp.
           */
          let updatedCustomer =
            await tx.customer.findUnique({
              where: {
                id: customer.id,
              },

              select: {
                stamps: true,
                feedbackRewardedAt: true,
                rewardEarnedAt: true,
              },
            });

          if (!updatedCustomer) {
            throw new Error(
              "Customer disappeared during feedback submission.",
            );
          }

          /*
           * If this feedback stamp completed the
           * customer's card, permanently lock in the
           * earned reward.
           *
           * Once rewardEarnedAt is set, a later café
           * target change cannot remove this reward.
           */
          if (
            !updatedCustomer.rewardEarnedAt &&
            updatedCustomer.stamps >=
              paidStampTarget
          ) {
            updatedCustomer =
              await tx.customer.update({
                where: {
                  id: customer.id,
                },

                data: {
                  rewardEarnedAt:
                    new Date(),
                },

                select: {
                  stamps: true,
                  feedbackRewardedAt:
                    true,
                  rewardEarnedAt: true,
                },
              });
          }

          return {
            type: "success" as const,
            rewardGranted,
            rewardPending: rewardGranted && alreadyReady,
            stamps:
              updatedCustomer.stamps,
            feedbackRewardedAt:
              updatedCustomer.feedbackRewardedAt,
            rewardEarnedAt:
              updatedCustomer.rewardEarnedAt,
            googleReviewUrl:
              customer.cafe.googleReviewUrl,
            loyaltyUnit:
              customer.cafe.businessType === "BARBERSHOP"
                ? "visit"
                : "stamp",
          };
        },
      );

    if (result.type === "not-found") {
      return jsonResponse(
        {
          error:
            "Loyalty card not found.",
        },
        404,
      );
    }

    if (result.type === "disabled") {
      return jsonResponse(
        {
          error:
            "Feedback is not enabled for this business.",
        },
        403,
      );
    }

    return jsonResponse({
      success: true,

      message: result.rewardGranted
        ? result.rewardPending
          ? `Thanks for your feedback! 1 ${result.loyaltyUnit} has been saved for your next cycle.`
          : `Thanks for your feedback! 1 ${result.loyaltyUnit} has been added to your card.`
        : "Thanks for your feedback!",

      rewardGranted:
        result.rewardGranted,

      stamps: result.stamps,

      feedbackRewardedAt:
        result.feedbackRewardedAt,

      rewardEarnedAt:
        result.rewardEarnedAt,

      googleReviewUrl:
        result.googleReviewUrl,
    });
  } catch (error) {
    console.error(
      "Customer feedback submission failed:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Something went wrong while submitting your feedback.",
      },
      500,
    );
  }
}
