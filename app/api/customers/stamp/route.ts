import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

function extractPublicToken(value: string) {
  const cleanedValue = value.trim();

  if (cleanedValue.startsWith("BL:")) {
    return cleanedValue.slice(3).trim();
  }

  return cleanedValue;
}

export async function POST(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);

  if (!access.allowed) {
    return NextResponse.json(
      { message: access.message },
      { status: access.status }
    );
  }

  const { authData } = access;

  if (!authData.cafe || !authData.cafeId) {
    return NextResponse.json(
      { message: "Café account required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const customerId =
      typeof body.id === "string" ? body.id.trim() : "";

    const rawToken =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const publicToken = rawToken
      ? extractPublicToken(rawToken)
      : "";

    if (!customerId && !publicToken) {
      return NextResponse.json(
        {
          message:
            "Customer ID or customer scan code is required.",
        },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        cafeId: authData.cafeId,

        ...(publicToken
          ? {
              publicToken,
            }
          : {
              id: customerId,
            }),
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
        {
          message:
            "This member does not belong to this café.",
        },
        { status: 404 }
      );
    }

    const rewardTarget = Math.max(
      authData.cafe.rewardTarget,
      1
    );

    const nextStampCount = customer.stamps + 1;
    const rewardEarned =
      nextStampCount >= rewardTarget;

    const updatedCustomer =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.customer.update({
              where: {
                id: customer.id,
              },
              data: {
                stamps: rewardEarned
                  ? 0
                  : nextStampCount,
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

          await transaction.stampTransaction.create({
            data: {
              cafeId: authData.cafeId,
              customerId: customer.id,
              userId: authData.user.id,
              type: "ADD",
              description: rewardEarned
                ? `${authData.cafe.rewardName} completed and card reset`
                : "Drink stamp added",
            },
          });

          return updated;
        }
      );

    return NextResponse.json({
      customer: updatedCustomer,
      previousStamps: customer.stamps,
      stamps: updatedCustomer.stamps,
      rewardTarget,
      rewardEarned,
      rewardName:
        authData.cafe.rewardName || "Reward",
      message: rewardEarned
        ? `${authData.cafe.rewardName || "Reward"} earned. New card started.`
        : "Stamp added successfully.",
    });
  } catch (error) {
    console.error("Add stamp error:", error);

    return NextResponse.json(
      {
        message: "Failed to add stamp.",
      },
      { status: 500 }
    );
  }
}