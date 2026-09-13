import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getDateParts(timeZone: string, date = new Date()) {
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

function isBirthdayRewardActive(
  birthday: Date,
  timeZone: string,
  validityDays: number,
) {
  const today = getDateParts(timeZone);
  const birthdayMonth = birthday.getUTCMonth() + 1;
  const birthdayDay = birthday.getUTCDate();
  const days = Math.max(1, Math.min(7, validityDays));

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(
      Date.UTC(today.year, today.month - 1, today.day - offset),
    );

    if (
      date.getUTCMonth() + 1 === birthdayMonth &&
      date.getUTCDate() === birthdayDay
    ) {
      return {
        active: true,
        label:
          offset === 0
            ? "Birthday today"
            : "Birthday reward active",
      };
    }
  }

  return {
    active: false,
    label: null,
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

    if (
      !authData.isCashier ||
      !authData.cafe ||
      !authData.cafeId
    ) {
      return jsonResponse(
        { message: "Cashier access required." },
        403,
      );
    }

    const cafe = authData.cafe;
    const timeZone = cafe.timezone?.trim() || "Africa/Cairo";
    const paidStampTarget = getLoyaltyProgressTarget({
      businessType: cafe.businessType,
      rewardTarget: cafe.rewardTarget,
    });

    const today = getDateParts(timeZone);
    const startOfToday = new Date(
      Date.UTC(today.year, today.month - 1, today.day),
    );
    const startOfTomorrow = new Date(
      Date.UTC(today.year, today.month - 1, today.day + 1),
    );

    const [customers, totalCustomers, newToday] =
      await Promise.all([
        prisma.customer.findMany({
          where: {
            cafeId: authData.cafeId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 500,
          select: {
            id: true,
            memberNumber: true,
            publicToken: true,
            name: true,
            stamps: true,
            rewardEarnedAt: true,
            birthday: true,
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
        }),
        prisma.customer.count({
          where: {
            cafeId: authData.cafeId,
          },
        }),
        prisma.customer.count({
          where: {
            cafeId: authData.cafeId,
            createdAt: {
              gte: startOfToday,
              lt: startOfTomorrow,
            },
          },
        }),
      ]);

    return jsonResponse({
      summary: {
        totalCustomers,
        newToday,
      },
      reward: {
        target: paidStampTarget,
        name: cafe.rewardName || "Free Drink",
      },
      members: customers.map((customer) => {
        const activeStampDates: Date[] = [];

        for (const transaction of customer.transactions) {
          if (transaction.type === "REDEEM") {
            break;
          }

          if (transaction.type === "ADD") {
            activeStampDates.push(transaction.createdAt);
          }
        }

        const stampDates = activeStampDates
          .slice(0, customer.stamps)
          .reverse();

        const birthdayOffer =
          cafe.birthdayRewardsEnabled
            ? isBirthdayRewardActive(
                customer.birthday,
                timeZone,
                cafe.birthdayValidityDays,
              )
            : { active: false, label: null };

        return {
          id: customer.id,
          memberNumber: customer.memberNumber,
          publicToken: customer.publicToken,
          name: customer.name,
          stamps: customer.stamps,
          stampDates,
          rewardReady:
            Boolean(customer.rewardEarnedAt) ||
            customer.stamps >= paidStampTarget,
          birthdayNotice: birthdayOffer.active
            ? birthdayOffer.label
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("Cashier members error:", error);

    return jsonResponse(
      { message: "Failed to load members." },
      500,
    );
  }
}
