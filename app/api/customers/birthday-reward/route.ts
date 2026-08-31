import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

const MAX_REQUEST_BODY_BYTES = 500;
const MAX_VALIDITY_DAYS = 7;

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

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

type BirthdayConfig = {
  enabled: boolean;
  rewardName: string;
  rewardDescription: string | null;
  purchaseRequirement: string | null;
  validityDays: number;
  friendDiscountEnabled: boolean;
  oneFriendDiscount: number;
  groupDiscount: number;
  timezone: string;
};

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
  return (
    year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0)
  );
}

function getCalendarDate(
  timezone: string,
  date = new Date(),
): CalendarDate {
  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const parts = formatter.formatToParts(date);
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
): CalendarDate {
  const { month, day } = getBirthdayMonthDay(birthday);

  // Feb 29 birthdays are observed on Feb 28 in non-leap years.
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

function toCalendarNumber(date: CalendarDate) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function getDayDifference(
  later: CalendarDate,
  earlier: CalendarDate,
) {
  return Math.round(
    (toCalendarNumber(later) - toCalendarNumber(earlier)) /
      86_400_000,
  );
}

function clampValidityDays(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(
    MAX_VALIDITY_DAYS,
    Math.max(1, Math.trunc(value)),
  );
}

function clampDiscount(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.trunc(value)));
}

function getBirthdayOfferStatus(
  birthday: Date,
  config: BirthdayConfig,
) {
  const today = getCalendarDate(config.timezone);
  const validityDays = clampValidityDays(config.validityDays);

  const possibleOccurrences = [
    getBirthdayDateForYear(birthday, today.year),
    getBirthdayDateForYear(birthday, today.year - 1),
  ];

  const activeOccurrence = possibleOccurrences.find(
    (occurrence) => {
      const elapsedDays = getDayDifference(today, occurrence);
      return elapsedDays >= 0 && elapsedDays < validityDays;
    },
  );

  if (!activeOccurrence) {
    return {
      year: today.year,
      enabled: config.enabled,
      isActive: false,
      isBirthday: false,
      daysSinceBirthday: null,
      validDay: null,
      validityDays,
    };
  }

  const daysSinceBirthday = getDayDifference(
    today,
    activeOccurrence,
  );

  return {
    year: activeOccurrence.year,
    enabled: config.enabled,
    isActive: config.enabled,
    isBirthday: daysSinceBirthday === 0,
    daysSinceBirthday,
    validDay:
      daysSinceBirthday === 0
        ? "BIRTHDAY"
        : `DAY_${daysSinceBirthday + 1}`,
    validityDays,
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
  const { customerId, publicToken } = normalizeLookup(lookup);

  if (
    publicToken &&
    !publicTokenSchema.safeParse(publicToken).success
  ) {
    return null;
  }

  return prisma.customer.findFirst({
    where: {
      cafeId,
      ...(publicToken ? { publicToken } : { id: customerId }),
    },
    select: {
      id: true,
      name: true,
      memberNumber: true,
      birthday: true,
    },
  });
}

async function getBirthdayConfig(cafeId: string) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: {
      birthdayRewardsEnabled: true,
      birthdayRewardName: true,
      birthdayRewardDescription: true,
      birthdayPurchaseRequirement: true,
      birthdayValidityDays: true,
      birthdayFriendDiscountEnabled: true,
      birthdayOneFriendDiscount: true,
      birthdayGroupDiscount: true,
      timezone: true,
    },
  });

  if (!cafe) {
    return null;
  }

  return {
    enabled: cafe.birthdayRewardsEnabled,
    rewardName:
      cafe.birthdayRewardName?.trim() || "Birthday Reward",
    rewardDescription:
      cafe.birthdayRewardDescription?.trim() || null,
    purchaseRequirement:
      cafe.birthdayPurchaseRequirement?.trim() || null,
    validityDays: clampValidityDays(cafe.birthdayValidityDays),
    friendDiscountEnabled:
      cafe.birthdayFriendDiscountEnabled,
    oneFriendDiscount: clampDiscount(
      cafe.birthdayOneFriendDiscount,
    ),
    groupDiscount: clampDiscount(cafe.birthdayGroupDiscount),
    timezone: cafe.timezone?.trim() || "UTC",
  } satisfies BirthdayConfig;
}

function serializeConfig(config: BirthdayConfig) {
  return {
    enabled: config.enabled,
    rewardName: config.rewardName,
    rewardDescription: config.rewardDescription,
    purchaseRequirement: config.purchaseRequirement,
    validityDays: config.validityDays,
    friendDiscountEnabled: config.friendDiscountEnabled,
    oneFriendDiscount: config.oneFriendDiscount,
    groupDiscount: config.groupDiscount,
  };
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

  const [customer, config] = await Promise.all([
    findCafeCustomer(authData.cafeId, validationResult.data),
    getBirthdayConfig(authData.cafeId),
  ]);

  if (!customer) {
    return jsonResponse(
      {
        message:
          "This member does not belong to this café.",
      },
      404,
    );
  }

  if (!config) {
    return jsonResponse(
      { message: "Café account not found." },
      404,
    );
  }

  const offer = getBirthdayOfferStatus(
    customer.birthday,
    config,
  );

  const redemption = config.enabled
    ? await prisma.birthdayRewardRedemption.findUnique({
        where: {
          customerId_year: {
            customerId: customer.id,
            year: offer.year,
          },
        },
        select: {
          redeemedAt: true,
        },
      })
    : null;

  return jsonResponse({
    customer: {
      id: customer.id,
      name: customer.name,
      memberNumber: customer.memberNumber,
    },
    config: serializeConfig(config),
    birthdayOffer: {
      ...offer,
      redeemed: Boolean(redemption),
      redeemedAt: redemption?.redeemedAt ?? null,
      canRedeem:
        config.enabled && offer.isActive && !redemption,
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

    const [customer, config] = await Promise.all([
      findCafeCustomer(authData.cafeId, validationResult.data),
      getBirthdayConfig(authData.cafeId),
    ]);

    if (!customer) {
      return jsonResponse(
        {
          message:
            "This member does not belong to this café.",
        },
        404,
      );
    }

    if (!config) {
      return jsonResponse(
        { message: "Café account not found." },
        404,
      );
    }

    if (!config.enabled) {
      return jsonResponse(
        {
          message: "Birthday rewards are disabled for this business.",
          config: serializeConfig(config),
        },
        409,
      );
    }

    const offer = getBirthdayOfferStatus(
      customer.birthday,
      config,
    );

    if (!offer.isActive) {
      return jsonResponse(
        {
          message:
            "This customer's birthday offer is not active today.",
          config: serializeConfig(config),
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
        message: `${config.rewardName} redeemed successfully.`,
        customer: {
          id: customer.id,
          name: customer.name,
          memberNumber: customer.memberNumber,
        },
        config: serializeConfig(config),
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
              "This birthday reward has already been redeemed this year.",
            config: serializeConfig(config),
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
      { message: "Failed to redeem birthday reward." },
      500,
    );
  }
}
