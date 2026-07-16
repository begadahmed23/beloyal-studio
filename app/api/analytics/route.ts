import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const REWARD_TARGET = 7;

export async function GET(request: NextRequest) {
  const session = await requireAuth(request.headers);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      newMembersToday,
      rewardsReady,
      stampResult,
    ] = await Promise.all([
      prisma.customer.count(),

      prisma.customer.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      prisma.customer.count({
        where: {
          stamps: {
            gte: REWARD_TARGET,
          },
        },
      }),

      prisma.customer.aggregate({
        _sum: {
          stamps: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalMembers,
      newMembersToday,
      totalStamps: stampResult._sum.stamps ?? 0,
      rewardsReady,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return NextResponse.json(
      { message: "Failed to load analytics." },
      { status: 500 }
    );
  }
}