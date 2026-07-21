import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const authData = await requireAuth(request.headers);

  if (!authData) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const birthday =
      typeof body.birthday === "string"
        ? body.birthday
        : "";

    if (!id || !name || !phone || !birthday) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          message:
            "Name must be 100 characters or fewer.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{11}$/.test(phone)) {
      return NextResponse.json(
        {
          message:
            "Phone number must contain exactly 11 digits.",
        },
        { status: 400 }
      );
    }

    const birthdayDate = new Date(birthday);

    if (Number.isNaN(birthdayDate.getTime())) {
      return NextResponse.json(
        { message: "Birthday is invalid." },
        { status: 400 }
      );
    }

    const existingCustomer =
      await prisma.customer.findFirst({
        where: {
          id,
          cafeId: authData.cafeId,
        },
      });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    const existingPhone =
      await prisma.customer.findFirst({
        where: {
          cafeId: authData.cafeId,
          phone,
          NOT: {
            id,
          },
        },
      });

    if (existingPhone) {
      return NextResponse.json(
        {
          message:
            "This phone number already belongs to another member in this café.",
        },
        { status: 409 }
      );
    }

    const updatedCustomer =
      await prisma.customer.update({
        where: {
          id,
        },
        data: {
          name,
          phone,
          birthday: birthdayDate,
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

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("PATCH customer error:", error);

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "This phone number already belongs to another member.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update member." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const authData = await requireAuth(request.headers);

  if (!authData) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    const customer =
      await prisma.customer.findFirst({
        where: {
          id,
          cafeId: authData.cafeId,
        },
        select: {
          id: true,
        },
      });

    if (!customer) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    await prisma.customer.delete({
      where: {
        id: customer.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE customer error:", error);

    return NextResponse.json(
      { message: "Failed to delete member." },
      { status: 500 }
    );
  }
}