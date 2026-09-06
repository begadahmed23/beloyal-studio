import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

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
          const customer =
            await tx.customer.findUnique({
              where: {
                publicToken: cleanToken,
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
                    googleReviewUrl: true,
                    rewardTarget: true,
                  },
                },
              },
            });

          if (
            !customer ||
            !customer.cafe.isActive
          ) {
            return {
              type: "not-found" as const,
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

          /*
           * Claim the one-time feedback stamp.
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

                stamps: {
                  increment: 1,
                },
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
                description:
                  "Feedback reward",

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
           * The café rewardTarget includes the reward
           * position.
           *
           * Example:
           *
           * rewardTarget = 7
           * paid stamps needed = 6
           */
          const paidStampTarget =
            Math.max(
              customer.cafe.rewardTarget -
                1,
              1,
            );

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
            stamps:
              updatedCustomer.stamps,
            feedbackRewardedAt:
              updatedCustomer.feedbackRewardedAt,
            rewardEarnedAt:
              updatedCustomer.rewardEarnedAt,
            googleReviewUrl:
              customer.cafe.googleReviewUrl,
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

    return jsonResponse({
      success: true,

      message: result.rewardGranted
        ? "Thanks for your feedback! 1 stamp has been added to your card."
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