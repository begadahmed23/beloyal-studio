import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

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

    const paidStampTarget = Math.max(
      rewardTarget - 1,
      0,
    );

    for (
      let attempt = 0;
      attempt < MAX_TRANSACTION_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const result = await prisma.$transaction(
          async (transaction) => {
            /*
             * Read the customer again inside the transaction.
             * We do not trust the stamp count fetched outside
             * the transaction because another request may have
             * changed it meanwhile.
             */
            const currentCustomer =
              await transaction.customer.findFirst({
                where: {
                  id: customer.id,
                  cafeId: authData.cafeId,
                },
                select: {
                  id: true,
                  stamps: true,
                },
              });

            if (!currentCustomer) {
              return {
                type: "not-found" as const,
              };
            }

            if (
              currentCustomer.stamps >= paidStampTarget
            ) {
              return {
                type: "reward-ready" as const,
              };
            }

            /*
             * Server-side duplicate protection.
             *
             * The scanner UI may also have a cooldown,
             * but the API itself must enforce it.
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

            /*
             * Increment only if the customer is still below
             * the paid-stamp target.
             */
            const updateResult =
              await transaction.customer.updateMany({
                where: {
                  id: currentCustomer.id,
                  cafeId: authData.cafeId,
                  stamps: {
                    lt: paidStampTarget,
                  },
                },
                data: {
                  stamps: {
                    increment: 1,
                  },
                },
              });

            if (updateResult.count !== 1) {
              return {
                type: "reward-ready" as const,
              };
            }

            /*
             * Every stamp increment must have a matching
             * StampTransaction so stampDates / lastStampedAt
             * remain accurate.
             */
            const stampTransaction =
              await transaction.stampTransaction.create({
                data: {
                  cafeId: authData.cafeId,
                  customerId: currentCustomer.id,
                  userId: authData.user.id,
                  type: "ADD",
                  description: "Drink stamp added",
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
            /*
             * This is important.
             *
             * If two stamp requests arrive at virtually the
             * same time, PostgreSQL will not allow both
             * transactions to behave as if they were first.
             */
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
              } before adding another stamp.`,
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

        const rewardReady =
          result.updatedCustomer.stamps >=
          paidStampTarget;

        return jsonResponse({
          customer: {
            ...result.updatedCustomer,
            stampDates: [],
          },
          stampCreatedAt: result.stampCreatedAt,
          rewardTarget,
          rewardReady,
          rewardName:
            authData.cafe.rewardName || "Reward",
          message: rewardReady
            ? `${
                authData.cafe.rewardName || "Reward"
              } is now ready.`
            : "Stamp added successfully.",
        });
      } catch (error) {
        /*
         * Prisma P2034 = transaction conflict / deadlock.
         *
         * With Serializable isolation this can happen when
         * two stamp requests arrive simultaneously.
         *
         * Retry. On the next attempt, the new ADD transaction
         * will be visible and the 5-second cooldown will stop
         * the duplicate request.
         */
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
          "The stamp could not be added safely. Please try again.",
      },
      409,
    );
  } catch (error) {
    console.error("Add stamp error:", error);

    return jsonResponse(
      {
        message: "Failed to add stamp.",
      },
      500,
    );
  }
}