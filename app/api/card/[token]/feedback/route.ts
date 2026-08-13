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
      typeof token === "string" ? token.trim() : "";

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
            validationResult.error.issues[0]?.message ||
            "Please check your feedback.",
        },
        400,
      );
    }

    const comment = validationResult.data.comment;

    const result = await prisma.$transaction(
      async (tx) => {
        const customer =
          await tx.customer.findUnique({
            where: {
              publicToken: cleanToken,
            },
            select: {
              id: true,
              cafeId: true,
              feedbackRewardedAt: true,
              stamps: true,
              cafe: {
                select: {
                  isActive: true,
                  googleReviewUrl: true,
                },
              },
            },
          });

        if (!customer || !customer.cafe.isActive) {
          return {
            type: "not-found" as const,
          };
        }

        /*
         * Always save the feedback.
         *
         * Customers are allowed to submit feedback
         * more than once.
         */
        await tx.customerFeedback.create({
          data: {
            comment,
            customerId: customer.id,
            cafeId: customer.cafeId,
          },
        });

        /*
         * Atomically claim the one-time feedback reward.
         *
         * updateMany is intentional here:
         * only the first request where feedbackRewardedAt
         * is still null can succeed.
         *
         * This prevents double stamps if the customer
         * taps Submit twice or sends two requests at once.
         */
        const rewardClaim =
          await tx.customer.updateMany({
            where: {
              id: customer.id,
              feedbackRewardedAt: null,
            },
            data: {
              feedbackRewardedAt: new Date(),
              stamps: {
                increment: 1,
              },
            },
          });

        const rewardGranted =
          rewardClaim.count === 1;

        /*
         * Get the final stamp count after the possible
         * reward has been applied.
         */
        const updatedCustomer =
          await tx.customer.findUnique({
            where: {
              id: customer.id,
            },
            select: {
              stamps: true,
              feedbackRewardedAt: true,
            },
          });

        if (!updatedCustomer) {
          throw new Error(
            "Customer disappeared during feedback submission.",
          );
        }

        return {
          type: "success" as const,
          rewardGranted,
          stamps: updatedCustomer.stamps,
          feedbackRewardedAt:
            updatedCustomer.feedbackRewardedAt,
          googleReviewUrl:
            customer.cafe.googleReviewUrl,
        };
      },
    );

    if (result.type === "not-found") {
      return jsonResponse(
        {
          error: "Loyalty card not found.",
        },
        404,
      );
    }

    return jsonResponse({
      success: true,
      message: result.rewardGranted
        ? "Thanks for your feedback! 1 stamp has been added to your card."
        : "Thanks for your feedback!",
      rewardGranted: result.rewardGranted,
      stamps: result.stamps,
      feedbackRewardedAt:
        result.feedbackRewardedAt,
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