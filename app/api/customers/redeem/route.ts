import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

export async function POST(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);

  if (!access.allowed) {
    return NextResponse.json(
      { message: access.message },
      { status: access.status },
    );
  }

  const { authData } = access;

  if (!authData.cafe || !authData.cafeId) {
    return NextResponse.json(
      { message: "Café account required." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const customerId =
      typeof body.id === "string" ? body.id.trim() : "";

    if (!customerId) {
      return NextResponse.json(
        { message: "Customer ID is required." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        cafeId: authData.cafeId,
      },
      select: {
        id: true,
        stamps: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "This member does not belong to this café." },
        { status: 404 },
      );
    }

    const rewardTarget = Math.max(authData.cafe.rewardTarget, 1);
    const paidStampTarget = Math.max(rewardTarget - 1, 0);

    if (customer.stamps < paidStampTarget) {
      return NextResponse.json(
        { message: "This member has not earned the reward yet." },
        { status: 409 },
      );
    }

    const updatedCustomer = await prisma.$transaction(
      async (transaction) => {
        const updated = await transaction.customer.update({
          where: { id: customer.id },
          data: { stamps: 0 },
          select: {
            id: true,
            memberNumber: true,
            publicToken: true,
            name: true,
            phone: true,
            birthday: true,
            stamps: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await transaction.stampTransaction.create({
          data: {
            cafeId: authData.cafeId,
            customerId: customer.id,
            userId: authData.user.id,
            type: "REDEEM",
            description: `${authData.cafe.rewardName || "Reward"} redeemed`,
          },
        });

        return updated;
      },
    );

    return NextResponse.json({
      ...updatedCustomer,
      stampDates: [],
    });
  } catch (error) {
    console.error("Redeem reward error:", error);

    return NextResponse.json(
      { message: "Failed to redeem reward." },
      { status: 500 },
    );
  }
}
