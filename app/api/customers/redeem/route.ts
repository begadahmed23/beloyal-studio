import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const REWARD_TARGET = 7;

export async function POST(request: NextRequest) {
  const session = await requireAuth(request.headers);

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { message: "Customer ID is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    if (customer.stamps < REWARD_TARGET) {
      return NextResponse.json(
        { message: "The member does not have a reward ready." },
        { status: 400 }
      );
    }

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: {
          stamps: 0,
        },
      });

      await tx.stampTransaction.create({
        data: {
          customerId: id,
          userId: session.user.id,
          type: "REDEEM",
          description: "Free drink redeemed",
        },
      });

      return updated;
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Redeem reward error:", error);

    return NextResponse.json(
      { message: "Failed to redeem reward." },
      { status: 500 }
    );
  }
}