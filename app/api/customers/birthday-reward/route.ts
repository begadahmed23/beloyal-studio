import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

const MAX_REQUEST_BODY_BYTES = 500;
const CAFE_TIME_ZONE = "Africa/Cairo";

const customerLookupSchema = z
  .object({
    id: z.string().trim().min(1).max(100).optional(),
    token: z.string().trim().max(100).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.id || value.token), {
    message: "Customer ID or customer scan code is required.",
  });

const publicTokenSchema = z.string().regex(/^[a-f0-9]{48}$/i);

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

function extractPublicToken(value: string) {
  const cleanedValue = value.trim();

  return cleanedValue.startsWith("BL:")
    ? cleanedValue.slice(3).trim()
    : cleanedValue;
}

function isLeapYear(year: number) {
  return year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);
}

function getCafeCalendarDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAFE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function getBirthdayMonthDay(birthday: Date) {
  return {
    month: birthday.getUTCMonth() + 1,
    day: birthday.getUTCDate(),
  };
}

function getBirthdayDateForYear(
  birthday: Date,
  year: number,
) {
  const { month, day } = getBirthdayMonthDay(birthday);

  // Feb 29 birthdays are treated as Feb 28 in non-leap years.
  const normalizedDay =
    month === 2 && day === 29 && !isLeapYear(year)
      ? 28
      : day;

  return {
    year,
    month,
    day: normalizedDay,
  };
}

function toCalendarNumber(date: {
  year: number;
  month: number;
  day: number;
}) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function getBirthdayOfferStatus(birthday: Date) {
  const today = getCafeCalendarDate();
  const birthdayThisYear = getBirthdayDateForYear(
    birthday,
    today.year,
  );

  const dayDifference = Math.round(
    (toCalendarNumber(today) -
      toCalendarNumber(birthdayThisYear)) /
      86_400_000,
  );

  const isBirthday = dayDifference === 0;
  const isDayAfterBirthday = dayDifference === 1;
  const isActive = isBirthday || isDayAfterBirthday;

  return {
    year: birthdayThisYear.year,
    isActive,
    isBirthday,
    isDayAfterBirthday,
    validDay: isBirthday
      ? "BIRTHDAY"
      : isDayAfterBirthday
        ? "DAY_AFTER"
        : null,
  };
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

  const declaredLength = Number(
    request.headers.get("content-length"),
  );

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

  const rawBody = await request.text();
  const bodySize = new TextEncoder().encode(rawBody).length;

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
        { message: "Request body is too large." },
        413,
      ),
    };
  }

  try {
    return { data: JSON.parse(rawBody) as unknown };
  } catch {
    return {
      error: jsonResponse(
        { message: "Invalid JSON request." },
        400,
      ),
    };
  }
}

function normalizeLookup(input: {
  id?: string;
  token?: string;
}) {
  const customerId = input.id?.trim() ?? "";
  const rawToken = input.token?.trim() ?? "";
  const publicToken = rawToken
    ? extractPublicToken(rawToken)
    : "";

  return { customerId, publicToken };
}

async function findCafeCustomer(
  cafeId: string,
  lookup: { id?: string; token?: string },
) {
  const { customerId, publicToken } =
    normalizeLookup(lookup);

  if (
    publicToken &&
    !publicTokenSchema.safeParse(publicToken).success
  ) {
    return null;
  }

  return prisma.customer.findFirst({
    where: {
      cafeId,
      ...(publicToken
        ? { publicToken }
        : { id: customerId }),
    },
    select: {
      id: true,
      name: true,
      memberNumber: true,
      birthday: true,
    },
  });
}

export async function GET(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);

  if (!access.allowed) {
    return jsonResponse(
      { message: access.message },
      access.status,
    );
  }

  const { authData } = access;

  if (!authData.cafeId) {
    return jsonResponse(
      { message: "Café account required." },
      403,
    );
  }

  const validationResult = customerLookupSchema.safeParse({
    id: request.nextUrl.searchParams.get("id") || undefined,
    token:
      request.nextUrl.searchParams.get("token") || undefined,
  });

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

  const customer = await findCafeCustomer(
    authData.cafeId,
    validationResult.data,
  );

  if (!customer) {
    return jsonResponse(
      {
        message:
          "This member does not belong to this café.",
      },
      404,
    );
  }

  const offer = getBirthdayOfferStatus(customer.birthday);

  const redemption =
    await prisma.birthdayRewardRedemption.findUnique({
      where: {
        customerId_year: {
          customerId: customer.id,
          year: offer.year,
        },
      },
      select: {
        redeemedAt: true,
      },
    });

  return jsonResponse({
    customer: {
      id: customer.id,
      name: customer.name,
      memberNumber: customer.memberNumber,
    },
    birthdayOffer: {
      ...offer,
      redeemed: Boolean(redemption),
      redeemedAt: redemption?.redeemedAt ?? null,
      canRedeem: offer.isActive && !redemption,
    },
  });
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

  if (!authData.cafeId) {
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

    const validationResult =
      customerLookupSchema.safeParse(bodyResult.data);

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

    const customer = await findCafeCustomer(
      authData.cafeId,
      validationResult.data,
    );

    if (!customer) {
      return jsonResponse(
        {
          message:
            "This member does not belong to this café.",
        },
        404,
      );
    }

    const offer = getBirthdayOfferStatus(customer.birthday);

    if (!offer.isActive) {
      return jsonResponse(
        {
          message:
            "This customer's birthday offer is not active today.",
          birthdayOffer: {
            ...offer,
            redeemed: false,
            canRedeem: false,
          },
        },
        409,
      );
    }

    try {
      const redemption =
        await prisma.birthdayRewardRedemption.create({
          data: {
            customerId: customer.id,
            cafeId: authData.cafeId,
            year: offer.year,
          },
          select: {
            redeemedAt: true,
          },
        });

      return jsonResponse({
        message: "Birthday gift redeemed successfully.",
        customer: {
          id: customer.id,
          name: customer.name,
          memberNumber: customer.memberNumber,
        },
        birthdayOffer: {
          ...offer,
          redeemed: true,
          redeemedAt: redemption.redeemedAt,
          canRedeem: false,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingRedemption =
          await prisma.birthdayRewardRedemption.findUnique({
            where: {
              customerId_year: {
                customerId: customer.id,
                year: offer.year,
              },
            },
            select: {
              redeemedAt: true,
            },
          });

        return jsonResponse(
          {
            message:
              "This birthday gift has already been redeemed this year.",
            birthdayOffer: {
              ...offer,
              redeemed: true,
              redeemedAt:
                existingRedemption?.redeemedAt ?? null,
              canRedeem: false,
            },
          },
          409,
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Birthday reward redemption error:", error);

    return jsonResponse(
      { message: "Failed to redeem birthday gift." },
      500,
    );
  }
}
