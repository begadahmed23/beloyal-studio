import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

const MAX_REQUEST_BODY_BYTES = 2_000;
const MAX_SEARCH_LENGTH = 100;
const MAX_CUSTOMERS_PER_REQUEST = 500;

const createCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Customer name is required.")
      .max(
        100,
        "Customer name must be 100 characters or fewer.",
      ),
    phone: z.string(),
    birthday: z.string(),
  })
  .strict();

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanPhone(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\D/g, "")
    : "";
}

function parseBirthday(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanValue = value.trim();

  const europeanMatch = cleanValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  const isoMatch = cleanValue.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  const day = europeanMatch
    ? Number(europeanMatch[1])
    : isoMatch
      ? Number(isoMatch[3])
      : 0;

  const month = europeanMatch
    ? Number(europeanMatch[2])
    : isoMatch
      ? Number(isoMatch[2])
      : 0;

  const year = europeanMatch
    ? Number(europeanMatch[3])
    : isoMatch
      ? Number(isoMatch[1])
      : 0;

  if (!day || !month || !year) {
    return null;
  }

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isRealDate) {
    return null;
  }

  const now = new Date();

  const currentDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );

  const earliestAllowedBirthday =
    new Date(
      Date.UTC(
        now.getUTCFullYear() - 120,
        0,
        1,
      ),
    );

  if (
    date > currentDate ||
    date < earliestAllowedBirthday
  ) {
    return null;
  }

  return date;
}

function generateMemberNumber() {
  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `BL-${randomPart}`;
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function uniqueErrorFields(error: unknown) {
  if (!isUniqueConstraintError(error)) {
    return [];
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.map(String);
  }

  if (typeof target === "string") {
    return [target];
  }

  return [];
}

async function readRequestBody(
  request: NextRequest,
) {
  const contentType =
    request.headers.get("content-type");

  if (
    !contentType ||
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    return {
      error: jsonResponse(
        {
          message:
            "Content-Type must be application/json.",
        },
        415,
      ),
    };
  }

  const contentLength =
    request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredLength =
      Number(contentLength);

    if (
      Number.isFinite(declaredLength) &&
      declaredLength >
        MAX_REQUEST_BODY_BYTES
    ) {
      return {
        error: jsonResponse(
          {
            message:
              "Request body is too large.",
          },
          413,
        ),
      };
    }
  }

  const rawBody = await request.text();

  const bodySize =
    new TextEncoder().encode(
      rawBody,
    ).length;

  if (bodySize === 0) {
    return {
      error: jsonResponse(
        {
          message:
            "Request body is required.",
        },
        400,
      ),
    };
  }

  if (
    bodySize > MAX_REQUEST_BODY_BYTES
  ) {
    return {
      error: jsonResponse(
        {
          message:
            "Request body is too large.",
        },
        413,
      ),
    };
  }

  try {
    return {
      data: JSON.parse(
        rawBody,
      ) as unknown,
    };
  } catch {
    return {
      error: jsonResponse(
        {
          message:
            "Invalid JSON request.",
        },
        400,
      ),
    };
  }
}

export async function GET(
  request: NextRequest,
) {
  try {
    const access =
      await requireActiveCafe(
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

    const cafe =
      access.authData.cafe;

    if (!cafe) {
      return jsonResponse(
        {
          message:
            "Café account not found.",
        },
        404,
      );
    }

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim() ?? "";

    if (
      search.length >
      MAX_SEARCH_LENGTH
    ) {
      return jsonResponse(
        {
          message:
            "Search must be 100 characters or fewer.",
        },
        400,
      );
    }

    const cleanedSearchPhone =
      cleanPhone(search);

    const customers =
      await prisma.customer.findMany({
        where: {
          cafeId: cafe.id,

          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains:
                        search,
                      mode:
                        "insensitive" as const,
                    },
                  },

                  ...(cleanedSearchPhone
                    ? [
                        {
                          phone:
                            {
                              contains:
                                cleanedSearchPhone,
                            },
                        },
                      ]
                    : []),

                  {
                    memberNumber: {
                      contains:
                        search,
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: {
          createdAt: "desc",
        },

        take:
          MAX_CUSTOMERS_PER_REQUEST,

        select: {
          id: true,
          memberNumber: true,
          name: true,
          phone: true,
          birthday: true,
          stamps: true,
          publicToken: true,

          /*
           * Needed by MemberCard so an
           * already-earned reward stays
           * locked even if the café later
           * changes its reward target.
           */
          rewardEarnedAt: true,

          createdAt: true,
          updatedAt: true,

          transactions: {
            orderBy: {
              createdAt: "desc",
            },

            select: {
              type: true,
              createdAt: true,
            },
          },
        },
      });

    const result = customers.map(
      ({
        transactions,
        ...customer
      }) => {
        const lastStampedAt =
          transactions.find(
            (transaction) =>
              transaction.type ===
              "ADD",
          )?.createdAt ?? null;

        const activeStampDates:
          Date[] = [];

        for (
          const transaction of transactions
        ) {
          if (
            transaction.type ===
            "REDEEM"
          ) {
            break;
          }

          if (
            transaction.type ===
            "ADD"
          ) {
            activeStampDates.push(
              transaction.createdAt,
            );
          }
        }

        const stampDates =
          activeStampDates
            .slice(
              0,
              customer.stamps,
            )
            .reverse();

        return {
          ...customer,
          lastStampedAt,
          stampDates,
        };
      },
    );

    return jsonResponse(result);
  } catch (error) {
    console.error(
      "GET customers error:",
      error,
    );

    return jsonResponse(
      {
        message:
          "Failed to load customers.",
      },
      500,
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const access =
      await requireActiveCafe(
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

    if (
      !access.authData.cafeId
    ) {
      return jsonResponse(
        {
          message:
            "Café account required.",
        },
        403,
      );
    }

    const bodyResult =
      await readRequestBody(
        request,
      );

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const validationResult =
      createCustomerSchema.safeParse(
        bodyResult.data,
      );

    if (
      !validationResult.success
    ) {
      return jsonResponse(
        {
          message:
            validationResult.error
              .issues[0]?.message ||
            "Invalid customer details.",
        },
        400,
      );
    }

    const name =
      validationResult.data.name;

    const phone = cleanPhone(
      validationResult.data.phone,
    );

    const birthday =
      parseBirthday(
        validationResult.data
          .birthday,
      );

    if (phone.length !== 11) {
      return jsonResponse(
        {
          message:
            "Phone number must contain exactly 11 digits.",
        },
        400,
      );
    }

    if (!birthday) {
      return jsonResponse(
        {
          message:
            "Enter a valid birthday in dd/mm/yyyy format.",
        },
        400,
      );
    }

    const cafeId =
      access.authData.cafeId;

    const existingCustomer =
      await prisma.customer.findFirst({
        where: {
          cafeId,
          phone,
        },
        select: {
          id: true,
        },
      });

    if (existingCustomer) {
      return jsonResponse(
        {
          message:
            "A member with this phone number already exists.",
        },
        409,
      );
    }

    /*
     * The database unique constraint
     * is the final protection.
     *
     * Retrying handles a rare
     * member-number collision safely.
     */
    for (
      let attempt = 0;
      attempt < 20;
      attempt += 1
    ) {
      try {
        const customer =
          await prisma.customer.create({
            data: {
              cafeId,

              memberNumber:
                generateMemberNumber(),

              publicToken:
                randomBytes(
                  24,
                ).toString("hex"),

              name,
              phone,
              birthday,
            },

            select: {
              id: true,
              memberNumber: true,
              publicToken: true,
              name: true,
              phone: true,
              birthday: true,
              stamps: true,

              rewardEarnedAt:
                true,

              createdAt: true,
              updatedAt: true,
            },
          });

        return jsonResponse(
          {
            ...customer,
            lastStampedAt: null,
            stampDates: [],
          },
          201,
        );
      } catch (error) {
        if (
          !isUniqueConstraintError(
            error,
          )
        ) {
          throw error;
        }

        const fields =
          uniqueErrorFields(
            error,
          );

        if (
          fields.some((field) =>
            field
              .toLowerCase()
              .includes("phone"),
          )
        ) {
          return jsonResponse(
            {
              message:
                "A member with this phone number already exists.",
            },
            409,
          );
        }

        const memberNumberCollision =
          fields.length === 0 ||
          fields.some((field) =>
            field
              .toLowerCase()
              .includes(
                "membernumber",
              ),
          );

        if (
          memberNumberCollision
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      "Could not generate a unique member number.",
    );
  } catch (error) {
    console.error(
      "POST customer error:",
      error,
    );

    return jsonResponse(
      {
        message:
          "Failed to create customer.",
      },
      500,
    );
  }
}