import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

const MAX_REQUEST_BODY_BYTES = 500;

const requestSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
  })
  .strict();

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

async function readRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type");

  if (
    !contentType ||
    !contentType.toLowerCase().includes("application/json")
  ) {
    return {
      error: jsonResponse(
        {
          message: "Content-Type must be application/json.",
        },
        415,
      ),
    };
  }

  const contentLength =
    request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredLength = Number(contentLength);

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_REQUEST_BODY_BYTES
    ) {
      return {
        error: jsonResponse(
          {
            message: "Request body is too large.",
          },
          413,
        ),
      };
    }
  }

  const rawBody = await request.text();

  const bodySize =
    new TextEncoder().encode(rawBody).length;

  if (bodySize === 0) {
    return {
      error: jsonResponse(
        {
          message: "Customer ID is required.",
        },
        400,
      ),
    };
  }

  if (bodySize > MAX_REQUEST_BODY_BYTES) {
    return {
      error: jsonResponse(
        {
          message: "Request body is too large.",
        },
        413,
      ),
    };
  }

  try {
    return {
      data: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      error: jsonResponse(
        {
          message: "Invalid JSON request.",
        },
        400,
      ),
    };
  }
}

export async function POST(request: NextRequest) {
  const access = await requireActiveCafe(
    request.headers,
  );

  if (!access.allowed) {
    return jsonResponse(
      {
        message: access.message,
      },
      access.status,
    );
  }

  const { authData } = access;

  if (!authData.cafe || !authData.cafeId) {
    return jsonResponse(
      {
        message: "Café account required.",
      },
      403,
    );
  }

  try {
    const bodyResult =
      await readRequestBody(request);

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const validationResult =
      requestSchema.safeParse(bodyResult.data);

    if (!validationResult.success) {
      return jsonResponse(
        {
          message: "Customer ID is required.",
        },
        400,
      );
    }

    const customerId =
      validationResult.data.id;

    const rewardName =
      authData.cafe.rewardName || "Reward";

    const rewardTarget = Math.max(
      authData.cafe.rewardTarget,
      1,
    );

    const paidStampTarget = getLoyaltyProgressTarget({
      businessType: authData.cafe.businessType,
      rewardTarget,
    });

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,
          cafeId: authData.cafeId,
        },
        select: {
          id: true,
          stamps: true,
          rewardEarnedAt: true,
        },
      });

    if (!customer) {
      return jsonResponse(
        {
          message:
            "This member does not belong to this café.",
        },
        404,
      );
    }

    /*
     * A reward is redeemable when:
     *
     * 1. rewardEarnedAt is already set, meaning the customer
     *    earned it under an earlier/current reward rule.
     *
     * OR
     *
     * 2. Their stamps already satisfy the current target.
     *    This second condition also keeps older customers
     *    compatible while rewardEarnedAt is being introduced.
     */
    const hasLockedReward =
      Boolean(customer.rewardEarnedAt);

    const qualifiesUnderCurrentTarget =
      customer.stamps >= paidStampTarget;

    if (
      !hasLockedReward &&
      !qualifiesUnderCurrentTarget
    ) {
      return jsonResponse(
        {
          message:
            "This member has not earned the reward yet.",
        },
        409,
      );
    }

    const updatedCustomer =
      await prisma.$transaction(
        async (transaction) => {
          /*
           * Redeem only if the customer still has either:
           *
           * - a locked earned reward
           * - or enough stamps under the current target
           *
           * This also prevents two simultaneous redemption
           * requests from both succeeding.
           */
          const redeemResult =
            await transaction.customer.updateMany({
              where: {
                id: customer.id,
                cafeId: authData.cafeId,

                OR: [
                  {
                    rewardEarnedAt: {
                      not: null,
                    },
                  },
                  {
                    stamps: {
                      gte: paidStampTarget,
                    },
                  },
                ],
              },
              data: {
                /*
                 * Start the next reward cycle fresh.
                 */
                stamps: 0,

                /*
                 * The earned reward has now been used.
                 *
                 * The customer's next cycle will follow
                 * whatever reward target the café currently
                 * has configured.
                 */
                rewardEarnedAt: null,
              },
            });

          if (redeemResult.count !== 1) {
            return null;
          }

          const updated =
            await transaction.customer.findUniqueOrThrow({
              where: {
                id: customer.id,
              },
              select: {
                id: true,
                memberNumber: true,
                publicToken: true,
                name: true,
                phone: true,
                birthday: true,
                stamps: true,
                rewardEarnedAt: true,
                createdAt: true,
                updatedAt: true,
              },
            });

          await transaction.stampTransaction.create({
            data: {
              cafeId: authData.cafeId,
              customerId: customer.id,
              userId: authData.user.id,
              type: "REDEEM",
              description: `${rewardName} redeemed`,
            },
          });

          return updated;
        },
      );

    if (!updatedCustomer) {
      return jsonResponse(
        {
          message:
            "This reward was already redeemed or is no longer available.",
        },
        409,
      );
    }

    return jsonResponse({
      ...updatedCustomer,
      stampDates: [],
    });
  } catch (error) {
    console.error(
      "Redeem reward error:",
      error,
    );

    return jsonResponse(
      {
        message: "Failed to redeem reward.",
      },
      500,
    );
  }
}
