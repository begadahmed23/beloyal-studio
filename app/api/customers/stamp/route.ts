import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

function extractPublicToken(value: string) {
  const cleanedValue = value.trim();
  return cleanedValue.startsWith("BL:")
    ? cleanedValue.slice(3).trim()
    : cleanedValue;
}

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
    const rawToken =
      typeof body.token === "string" ? body.token.trim() : "";
    const publicToken = rawToken ? extractPublicToken(rawToken) : "";

    if (!customerId && !publicToken) {
      return NextResponse.json(
        { message: "Customer ID or customer scan code is required." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        cafeId: authData.cafeId,
        ...(publicToken ? { publicToken } : { id: customerId }),
      },
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

    if (!customer) {
      return NextResponse.json(
        { message: "This member does not belong to this café." },
        { status: 404 },
      );
    }

    const rewardTarget = Math.max(authData.cafe.rewardTarget, 1);
    const paidStampTarget = Math.max(rewardTarget - 1, 0);

    if (customer.stamps >= paidStampTarget) {
      return NextResponse.json(
        {
          message: `${authData.cafe.rewardName || "Reward"} is ready. Redeem it instead of adding another stamp.`,
          rewardReady: true,
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (transaction) => {
      const updatedCustomer = await transaction.customer.update({
        where: { id: customer.id },
        data: { stamps: { increment: 1 } },
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

      const stampTransaction = await transaction.stampTransaction.create({
        data: {
          cafeId: authData.cafeId,
          customerId: customer.id,
          userId: authData.user.id,
          type: "ADD",
          description: "Drink stamp added",
        },
        select: { createdAt: true },
      });

      return {
        updatedCustomer,
        stampCreatedAt: stampTransaction.createdAt,
      };
    });

    return NextResponse.json({
      customer: {
        ...result.updatedCustomer,
        stampDates: [],
      },
      stampCreatedAt: result.stampCreatedAt,
      rewardTarget,
      rewardReady: result.updatedCustomer.stamps >= paidStampTarget,
      rewardName: authData.cafe.rewardName || "Reward",
      message:
        result.updatedCustomer.stamps >= paidStampTarget
          ? `${authData.cafe.rewardName || "Reward"} is now ready.`
          : "Stamp added successfully.",
    });
  } catch (error) {
    console.error("Add stamp error:", error);

    return NextResponse.json(
      { message: "Failed to add stamp." },
      { status: 500 },
    );
  }
}
