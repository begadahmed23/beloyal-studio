import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const CAFE_TIME_ZONE = "Africa/Cairo";

function getTimeZoneOffsetMilliseconds(
  date: Date,
  timeZone: string
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  });

  const timeZoneName =
    formatter
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")
      ?.value ?? "GMT+00:00";

  const match = timeZoneName.match(
    /GMT([+-])(\d{2}):?(\d{2})/
  );

  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);

  return sign * (hours * 60 + minutes) * 60 * 1000;
}

function zonedDateTimeToUtc(
  year: number,
  monthIndex: number,
  day: number,
  timeZone: string
) {
  const assumedUtc = new Date(
    Date.UTC(year, monthIndex, day, 0, 0, 0, 0)
  );

  const firstOffset = getTimeZoneOffsetMilliseconds(
    assumedUtc,
    timeZone
  );

  let result = new Date(
    assumedUtc.getTime() - firstOffset
  );

  const finalOffset = getTimeZoneOffsetMilliseconds(
    result,
    timeZone
  );

  if (finalOffset !== firstOffset) {
    result = new Date(
      assumedUtc.getTime() - finalOffset
    );
  }

  return result;
}

function getCurrentMonthRange(timeZone: string) {
  const now = new Date();

  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const year = Number(
    dateParts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    dateParts.find((part) => part.type === "month")?.value
  );

  const startOfMonth = zonedDateTimeToUtc(
    year,
    month - 1,
    1,
    timeZone
  );

  const startOfNextMonth = zonedDateTimeToUtc(
    month === 12 ? year + 1 : year,
    month === 12 ? 0 : month,
    1,
    timeZone
  );

  return {
    startOfMonth,
    startOfNextMonth,
  };
}

function getTodayRange(timeZone: string) {
  const now = new Date();

  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const year = Number(
    dateParts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    dateParts.find((part) => part.type === "month")?.value
  );

  const day = Number(
    dateParts.find((part) => part.type === "day")?.value
  );

  const startOfToday = zonedDateTimeToUtc(
    year,
    month - 1,
    day,
    timeZone
  );

  const nextCalendarDay = new Date(
    Date.UTC(year, month - 1, day + 1)
  );

  const startOfTomorrow = zonedDateTimeToUtc(
    nextCalendarDay.getUTCFullYear(),
    nextCalendarDay.getUTCMonth(),
    nextCalendarDay.getUTCDate(),
    timeZone
  );

  return {
    startOfToday,
    startOfTomorrow,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (!authData) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!authData.cafe) {
      return NextResponse.json(
        { message: "Café account not found." },
        { status: 404 }
      );
    }

    const cafeId = authData.cafe.id;

    const { startOfToday, startOfTomorrow } =
      getTodayRange(CAFE_TIME_ZONE);

    const { startOfMonth, startOfNextMonth } =
      getCurrentMonthRange(CAFE_TIME_ZONE);

    const [
      totalMembers,
      newMembersToday,
      activeMemberGroups,
      freeDrinksThisMonth,
      ratingAggregate,
      ratingGroups,
      recentRatings,
    ] = await Promise.all([
      prisma.customer.count({
        where: {
          cafeId,
        },
      }),

      prisma.customer.count({
        where: {
          cafeId,
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),

      prisma.stampTransaction.groupBy({
        by: ["customerId"],
        where: {
          cafeId,
          type: {
            in: ["ADD", "REDEEM"],
          },
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),

      prisma.stampTransaction.count({
        where: {
          cafeId,
          type: "REDEEM",
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),

      prisma.customerReview.aggregate({
        where: {
          cafeId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      }),

      prisma.customerReview.groupBy({
        by: ["rating"],
        where: {
          cafeId,
        },
        _count: {
          rating: true,
        },
      }),

      prisma.customerReview.findMany({
        where: {
          cafeId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              memberNumber: true,
            },
          },
        },
      }),
    ]);

    const ratingBreakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const group of ratingGroups) {
      if (group.rating >= 1 && group.rating <= 5) {
        ratingBreakdown[
          group.rating as keyof typeof ratingBreakdown
        ] = group._count.rating;
      }
    }

    return NextResponse.json({
      totalMembers,
      newMembersToday,
      activeMembersThisMonth: activeMemberGroups.length,
      freeDrinksThisMonth,
      rewardTarget: authData.cafe.rewardTarget,
      rewardName:
        authData.cafe.rewardName || "Free Drink",
      reviews: {
        averageRating:
          ratingAggregate._avg.rating ?? 0,
        totalRatings:
          ratingAggregate._count.rating,
        breakdown: ratingBreakdown,
        recentRatings,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return NextResponse.json(
      { message: "Failed to load analytics." },
      { status: 500 }
    );
  }
}