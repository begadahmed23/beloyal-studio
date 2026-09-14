import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (
      !authData ||
      authData.isSuperAdmin ||
      authData.isCashier ||
      !authData.cafeId
    ) {
      return json(
        { message: "Café administrator access required." },
        403,
      );
    }

    const [ratingSummary, ratings, comments] = await Promise.all([
      prisma.customerReview.aggregate({
        where: { cafeId: authData.cafeId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.customerReview.findMany({
        where: { cafeId: authData.cafeId },
        orderBy: { updatedAt: "desc" },
        take: 50,
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
      prisma.customerFeedback.findMany({
        where: { cafeId: authData.cafeId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          comment: true,
          createdAt: true,
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

    return json({
      summary: {
        averageRating: ratingSummary._avg.rating ?? null,
        ratingCount: ratingSummary._count.rating,
        commentCount: await prisma.customerFeedback.count({
          where: { cafeId: authData.cafeId },
        }),
      },
      ratings,
      comments,
    });
  } catch (error) {
    console.error("Admin feedback dashboard error:", error);

    return json(
      { message: "Failed to load customer feedback." },
      500,
    );
  }
}
