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

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    if (existingCustomer.stamps >= REWARD_TARGET) {
      return NextResponse.json(
        { message: "The loyalty card is already complete." },
        { status: 400 }
      );
    }

    const customer = await prisma.$transaction(async (tx) => {
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          stamps: {
            increment: 1,
          },
        },
      });

      await tx.stampTransaction.create({
        data: {
          customerId: id,
          userId: session.user.id,
          type: "ADD",
          description: "Drink stamp added",
        },
      });

      return updatedCustomer;
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Add stamp error:", error);

    return NextResponse.json(
      { message: "Failed to add stamp." },
      { status: 500 }
    );
  }
}