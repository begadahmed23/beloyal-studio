import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    const cleanToken = token?.trim();

    if (!cleanToken) {
      return NextResponse.json(
        { message: "Customer card token is required." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("rating" in body)
    ) {
      return NextResponse.json(
        { message: "Rating is required." },
        { status: 400 }
      );
    }

    const rating = Number(
      (body as { rating: unknown }).rating
    );

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { message: "Rating must be a whole number from 1 to 5." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: {
        publicToken: cleanToken,
      },
      select: {
        id: true,
        cafeId: true,
        cafe: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer card was not found." },
        { status: 404 }
      );
    }

    if (!customer.cafe.isActive) {
      return NextResponse.json(
        { message: "This café is currently unavailable." },
        { status: 403 }
      );
    }

    const review = await prisma.customerReview.upsert({
      where: {
        customerId: customer.id,
      },
      update: {
        rating,
        cafeId: customer.cafeId,
      },
      create: {
        rating,
        customerId: customer.id,
        cafeId: customer.cafeId,
      },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Thank you. Your rating has been saved.",
      review,
    });
  } catch (error) {
    console.error("Save customer review error:", error);

    return NextResponse.json(
      { message: "Unable to save your rating right now." },
      { status: 500 }
    );
  }
}