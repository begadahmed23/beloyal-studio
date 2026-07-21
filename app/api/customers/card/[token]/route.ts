import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    const cleanToken =
      typeof token === "string" ? token.trim() : "";

    if (!cleanToken) {
      return NextResponse.json(
        { message: "Card token is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        publicToken: cleanToken,
        cafeId: {
          not: null,
        },
        cafe: {
          isActive: true,
        },
      },
      select: {
        id: true,
        memberNumber: true,
        publicToken: true,
        name: true,
        birthday: true,
        stamps: true,
        createdAt: true,
        updatedAt: true,

        cafe: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            theme: true,
            primaryColor: true,
            secondaryColor: true,
            backgroundColor: true,
            rewardTarget: true,
            rewardName: true,
            rewardDescription: true,
            eligiblePurchaseDescription: true,
          },
        },
      },
    });

    if (!customer || !customer.cafe) {
      return NextResponse.json(
        { message: "Loyalty card not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: customer.id,
      memberNumber: customer.memberNumber,
      publicToken: customer.publicToken,
      name: customer.name,
      birthday: customer.birthday,
      stamps: customer.stamps,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,

      cafe: customer.cafe,
    });
  } catch (error) {
    console.error("Public card error:", error);

    return NextResponse.json(
      { message: "Failed to load loyalty card." },
      { status: 500 }
    );
  }
}