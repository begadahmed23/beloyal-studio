import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

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
        { message: "Content-Type must be application/json." },
        415,
      ),
    };
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredLength = Number(contentLength);

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_REQUEST_BODY_BYTES
    ) {
      return {
        error: jsonResponse(
          { message: "Request body is too large." },
          413,
        ),
      };
    }
  }

  const rawBody = await request.text();
  const bodySize = new TextEncoder().encode(rawBody).length;

  if (bodySize === 0) {
    return {
      error: jsonResponse(
        { message: "Customer ID is required." },
        400,
      ),
    };
  }

  if (bodySize > MAX_REQUEST_BODY_BYTES) {
    return {
      error: jsonResponse(
        { message: "Request body is too large." },
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
        { message: "Invalid JSON request." },
        400,
      ),
    };
  }
}

export async function POST(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);

  if (!access.allowed) {
    return jsonResponse(
      { message: access.message },
      access.status,
    );
  }

  const { authData } = access;

  if (!authData.cafe || !authData.cafeId) {
    return jsonResponse(
      { message: "Café account required." },
      403,
    );
  }

  try {
    const bodyResult = await readRequestBody(request);

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const validationResult = requestSchema.safeParse(
      bodyResult.data,
    );

    if (!validationResult.success) {
      return jsonResponse(
        { message: "Customer ID is required." },
        400,
      );
    }

    const customerId = validationResult.data.id;
    const rewardName =
      authData.cafe.rewardName || "Reward";

    const rewardTarget = Math.max(
      authData.cafe.rewardTarget,
      1,
    );

    /*
     * Require at least one paid stamp, even if a café has an
     * invalid reward target of 1. This prevents unlimited
     * redemptions while the stamp balance is already zero.
     */
    const paidStampTarget = Math.max(
      rewardTarget - 1,
      1,
    );

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        cafeId: authData.cafeId,
      },
      select: {
        id: true,
        stamps: true,
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

    if (customer.stamps < paidStampTarget) {
      return jsonResponse(
        {
          message:
            "This member has not earned the reward yet.",
        },
        409,
      );
    }

    const updatedCustomer = await prisma.$transaction(
      async (transaction) => {
        /*
         * Only one simultaneous request can change the eligible
         * stamp balance to zero. Later requests will update
         * nothing and therefore cannot create another redemption.
         */
        const redeemResult =
          await transaction.customer.updateMany({
            where: {
              id: customer.id,
              cafeId: authData.cafeId,
              stamps: {
                gte: paidStampTarget,
              },
            },
            data: {
              stamps: 0,
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
    console.error("Redeem reward error:", error);

    return jsonResponse(
      { message: "Failed to redeem reward." },
      500,
    );
  }
}