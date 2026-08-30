import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

const DAY_MS = 86_400_000;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isLeapYear(year: number) {
  return year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);
}

function getCalendarDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
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

function toCalendarNumber(date: {
  year: number;
  month: number;
  day: number;
}) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function addCalendarDays(
  date: { year: number; month: number; day: number },
  days: number,
) {
  const shifted = new Date(toCalendarNumber(date) + days * DAY_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function getBirthdayDateForYear(birthday: Date, year: number) {
  const month = birthday.getUTCMonth() + 1;
  const originalDay = birthday.getUTCDate();
  const day =
    month === 2 && originalDay === 29 && !isLeapYear(year)
      ? 28
      : originalDay;

  return { year, month, day };
}

function isSameCalendarDate(
  left: { year: number; month: number; day: number },
  right: { year: number; month: number; day: number },
) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day
  );
}

function getBirthdayStatus(
  birthday: Date,
  today: { year: number; month: number; day: number },
  validityDays: number,
) {
  const candidates = [
    getBirthdayDateForYear(birthday, today.year - 1),
    getBirthdayDateForYear(birthday, today.year),
    getBirthdayDateForYear(birthday, today.year + 1),
  ];

  const todayNumber = toCalendarNumber(today);
  const activeBirthday = candidates.find((candidate) => {
    const difference = Math.round(
      (todayNumber - toCalendarNumber(candidate)) / DAY_MS,
    );

    return difference >= 0 && difference < validityDays;
  });

  const birthdayToday = getBirthdayDateForYear(birthday, today.year);
  const tomorrow = addCalendarDays(today, 1);
  const birthdayTomorrow = getBirthdayDateForYear(
    birthday,
    tomorrow.year,
  );

  return {
    isBirthdayToday: isSameCalendarDate(birthdayToday, today),
    isBirthdayTomorrow: isSameCalendarDate(
      birthdayTomorrow,
      tomorrow,
    ),
    activeYear: activeBirthday?.year ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireActiveCafe(request.headers);

    if (!access.allowed) {
      return jsonResponse(
        { message: access.message },
        access.status,
      );
    }

    const { authData } = access;

    if (!authData.cafeId || !authData.cafe) {
      return jsonResponse(
        { message: "Business account required." },
        403,
      );
    }

    const cafe = authData.cafe;

    if (!cafe.birthdayRewardsEnabled) {
      return jsonResponse({
        enabled: false,
        summary: {
          today: 0,
          tomorrow: 0,
          activeOffers: 0,
          redeemedToday: 0,
        },
      });
    }

    const now = new Date();
    const today = getCalendarDate(now, cafe.timezone);
    const validityDays = Math.max(
      1,
      Math.min(cafe.birthdayValidityDays, 7),
    );

    const [customers, yearlyRedemptions, recentRedemptions] =
      await Promise.all([
        prisma.customer.findMany({
          where: { cafeId: authData.cafeId },
          select: {
            id: true,
            birthday: true,
          },
        }),
        prisma.birthdayRewardRedemption.findMany({
          where: {
            cafeId: authData.cafeId,
            year: {
              in: [today.year - 1, today.year],
            },
          },
          select: {
            customerId: true,
            year: true,
          },
        }),
        prisma.birthdayRewardRedemption.findMany({
          where: {
            cafeId: authData.cafeId,
            redeemedAt: {
              gte: new Date(now.getTime() - 36 * 60 * 60 * 1000),
            },
          },
          select: {
            redeemedAt: true,
          },
        }),
      ]);

    const redeemedKeys = new Set(
      yearlyRedemptions.map(
        (redemption) =>
          `${redemption.customerId}:${redemption.year}`,
      ),
    );

    let birthdaysToday = 0;
    let birthdaysTomorrow = 0;
    let activeOffers = 0;

    for (const customer of customers) {
      const status = getBirthdayStatus(
        customer.birthday,
        today,
        validityDays,
      );

      if (status.isBirthdayToday) {
        birthdaysToday += 1;
      }

      if (status.isBirthdayTomorrow) {
        birthdaysTomorrow += 1;
      }

      if (
        status.activeYear !== null &&
        !redeemedKeys.has(
          `${customer.id}:${status.activeYear}`,
        )
      ) {
        activeOffers += 1;
      }
    }

    const redeemedToday = recentRedemptions.filter(
      (redemption) =>
        isSameCalendarDate(
          getCalendarDate(redemption.redeemedAt, cafe.timezone),
          today,
        ),
    ).length;

    return jsonResponse({
      enabled: true,
      summary: {
        today: birthdaysToday,
        tomorrow: birthdaysTomorrow,
        activeOffers,
        redeemedToday,
      },
    });
  } catch (error) {
    console.error("Birthday dashboard summary error:", error);

    return jsonResponse(
      { message: "Unable to load birthday summary." },
      500,
    );
  }
}
