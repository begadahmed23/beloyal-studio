import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const authData = await requireAuth(request.headers);

  if (!authData) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

  const cafeId = authData.cafeId;

if (!authData.cafe) {
  return Response.json(
    { error: "Cafe not found" },
    { status: 404 }
  );
}

const rewardTarget = authData.cafe.rewardTarget;

    const [
      totalMembers,
      newMembersToday,
      rewardsReady,
      stampResult,
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
            gte: today,
          },
        },
      }),

      prisma.customer.count({
        where: {
          cafeId,
          stamps: {
            gte: rewardTarget,
          },
        },
      }),

      prisma.customer.aggregate({
        where: {
          cafeId,
        },
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
      rewardTarget,
      rewardName: authData.cafe.rewardName,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return NextResponse.json(
      { message: "Failed to load analytics." },
      { status: 500 }
    );
  }
}