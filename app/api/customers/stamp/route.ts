import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

const MAX_REQUEST_BODY_BYTES = 500;
const STAMP_COOLDOWN_MS = 5_000;
const MAX_TRANSACTION_ATTEMPTS = 3;

const requestSchema = z
  .object({
    id: z.string().trim().min(1).max(100).optional(),
    token: z.string().trim().max(100).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.id || value.token), {
    message: "Customer ID or customer scan code is required.",
  });

const publicTokenSchema = z
  .string()
  .regex(/^[a-f0-9]{48}$/i);

function extractPublicToken(value: string) {
  const cleanedValue = value.trim();

  return cleanedValue.startsWith("BL:")
    ? cleanedValue.slice(3).trim()
    : cleanedValue;
}

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

  const declaredLength = Number(
    request.headers.get("content-length"),
  );

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

  const rawBody = await request.text();

  const bodySize =
    new TextEncoder().encode(rawBody).length;

  if (bodySize === 0) {
    return {
      error: jsonResponse(
        {
          message:
            "Customer ID or customer scan code is required.",
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
  const access = await requireActiveCafe(request.headers);

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
    const bodyResult = await readRequestBody(request);

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const validationResult =
      requestSchema.safeParse(bodyResult.data);

    if (!validationResult.success) {
      return jsonResponse(
        {
          message:
            validationResult.error.issues[0]?.message ||
            "Invalid request.",
        },
        400,
      );
    }

    const customerId =
      validationResult.data.id?.trim() ?? "";

    const rawToken =
      validationResult.data.token?.trim() ?? "";

    const publicToken = rawToken
      ? extractPublicToken(rawToken)
      : "";

    if (
      publicToken &&
      !publicTokenSchema.safeParse(publicToken).success
    ) {
      return jsonResponse(
        {
          message:
            "This member does not belong to this café.",
        },
        404,
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        cafeId: authData.cafeId,

        ...(publicToken
          ? {
              publicToken,
            }
          : {
              id: customerId,
            }),
      },
      select: {
        id: true,
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

    const rewardTarget = Math.max(
      authData.cafe.rewardTarget,
      1,
    );

    const paidStampTarget = getLoyaltyProgressTarget({
      businessType: authData.cafe.businessType,
      rewardTarget,
    });
    const isBarbershop =
      authData.cafe.businessType === "BARBERSHOP";
    const loyaltyUnit = isBarbershop ? "visit" : "stamp";

    for (
      let attempt = 0;
      attempt < MAX_TRANSACTION_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const result = await prisma.$transaction(
          async (transaction) => {
            const currentCustomer =
              await transaction.customer.findFirst({
                where: {
                  id: customer.id,
                  cafeId: authData.cafeId,
                },
                select: {
                  id: true,
                  stamps: true,
                  rewardEarnedAt: true,
                },
              });

            if (!currentCustomer) {
              return {
                type: "not-found" as const,
              };
            }

            /*
             * Once a reward has been earned, it stays
             * locked until redemption.
             *
             * Future café target changes do not remove it.
             */
            if (currentCustomer.rewardEarnedAt) {
              return {
                type: "reward-ready" as const,
              };
            }

            /*
             * If the customer's existing stamps already
             * satisfy the current requirement, lock the
             * reward before returning.
             */
            if (
              currentCustomer.stamps >= paidStampTarget
            ) {
              await transaction.customer.update({
                where: {
                  id: currentCustomer.id,
                },
                data: {
                  rewardEarnedAt: new Date(),
                },
              });

              return {
                type: "reward-ready" as const,
              };
            }

            /*
             * Server-side duplicate protection.
             */
            const lastAdd =
              await transaction.stampTransaction.findFirst({
                where: {
                  cafeId: authData.cafeId,
                  customerId: currentCustomer.id,
                  type: "ADD",
                },
                orderBy: {
                  createdAt: "desc",
                },
                select: {
                  createdAt: true,
                },
              });

            if (lastAdd) {
              const elapsedMs =
                Date.now() - lastAdd.createdAt.getTime();

              if (elapsedMs < STAMP_COOLDOWN_MS) {
                const remainingMs =
                  STAMP_COOLDOWN_MS - elapsedMs;

                return {
                  type: "cooldown" as const,
                  retryAfterMs: remainingMs,
                };
              }
            }

            const newStampCount =
              currentCustomer.stamps + 1;

            const rewardWillBeEarned =
              newStampCount >= paidStampTarget;

            const earnedAt =
              rewardWillBeEarned
                ? new Date()
                : null;

            /*
             * Add the stamp and, when this stamp completes
             * the requirement, permanently lock the reward.
             */
            const updateResult =
              await transaction.customer.updateMany({
                where: {
                  id: currentCustomer.id,
                  cafeId: authData.cafeId,
                  rewardEarnedAt: null,
                  stamps: {
                    lt: paidStampTarget,
                  },
                },
                data: {
                  stamps: {
                    increment: 1,
                  },

                  ...(earnedAt
                    ? {
                        rewardEarnedAt: earnedAt,
                      }
                    : {}),
                },
              });

            if (updateResult.count !== 1) {
              return {
                type: "reward-ready" as const,
              };
            }

            /*
             * Keep audit history synchronized with stamps.
             */
            const stampTransaction =
              await transaction.stampTransaction.create({
                data: {
                  cafeId: authData.cafeId,
                  customerId: currentCustomer.id,
                  userId: authData.user.id,
                  type: "ADD",
                  description: isBarbershop
                    ? "Barbershop visit recorded"
                    : "Drink stamp added",
                },
                select: {
                  createdAt: true,
                },
              });

            const updatedCustomer =
              await transaction.customer.findUniqueOrThrow({
                where: {
                  id: currentCustomer.id,
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

            return {
              type: "success" as const,
              updatedCustomer,
              stampCreatedAt:
                stampTransaction.createdAt,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        if (result.type === "not-found") {
          return jsonResponse(
            {
              message:
                "This member does not belong to this café.",
            },
            404,
          );
        }

        if (result.type === "cooldown") {
          const retryAfterSeconds = Math.max(
            1,
            Math.ceil(result.retryAfterMs / 1000),
          );

          return jsonResponse(
            {
              message: `Please wait ${retryAfterSeconds} second${
                retryAfterSeconds === 1 ? "" : "s"
              } before recording another ${loyaltyUnit}.`,
              cooldown: true,
              retryAfterMs: result.retryAfterMs,
            },
            409,
          );
        }

        if (result.type === "reward-ready") {
          return jsonResponse(
            {
              message: `${
                authData.cafe.rewardName || "Reward"
              } is ready. Redeem it instead of adding another stamp.`,
              rewardReady: true,
            },
            409,
          );
        }

        const rewardReady = Boolean(
          result.updatedCustomer.rewardEarnedAt,
        );

        return jsonResponse({
          customer: {
            ...result.updatedCustomer,
            stampDates: [],
          },

          stampCreatedAt:
            result.stampCreatedAt,

          rewardTarget,

          rewardReady,

          rewardName:
            authData.cafe.rewardName ||
            "Reward",

          message: rewardReady
            ? `${
                authData.cafe.rewardName || "Reward"
              } is now ready.`
            : isBarbershop
              ? "Visit recorded successfully."
              : "Stamp added successfully.",
        });
      } catch (error) {
        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < MAX_TRANSACTION_ATTEMPTS - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    return jsonResponse(
      {
        message:
          `The ${loyaltyUnit} could not be recorded safely. Please try again.`,
      },
      409,
    );
  } catch (error) {
    console.error("Add stamp error:", error);

    return jsonResponse(
      {
        message: authData.cafe.businessType === "BARBERSHOP"
          ? "Failed to record visit."
          : "Failed to add stamp.",
      },
      500,
    );
  }
}
