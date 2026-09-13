import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const MAX_RESULTS = 1000;

export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (
      !authData ||
      authData.isSuperAdmin ||
      authData.isCashier ||
      !authData.cafeId ||
      !authData.cafe
    ) {
      return NextResponse.json(
        { message: "Customer data is only available to café administrators." },
        { status: 403 },
      );
    }

    const customers = await prisma.customer.findMany({
      where: {
        cafeId: authData.cafeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_RESULTS,
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        instagram: true,
        birthday: true,
        stamps: true,
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

    const result = customers.map(({ transactions, ...customer }) => {
      const addTransactions = transactions.filter(
        (transaction) => transaction.type === "ADD",
      );

      const redeemTransactions = transactions.filter(
        (transaction) => transaction.type === "REDEEM",
      );

      return {
        ...customer,
        totalVisits: addTransactions.length,
        rewardsRedeemed: redeemTransactions.length,
        lastVisitAt: addTransactions[0]?.createdAt ?? null,
      };
    });

    return NextResponse.json(
      {
        cafe: {
          name: authData.cafe.name,
          rewardTarget: authData.cafe.rewardTarget,
        },
        customers: result,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Admin customer database error:", error);

    return NextResponse.json(
      { message: "Failed to load customer database." },
      { status: 500 },
    );
  }
}
