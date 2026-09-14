import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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
  try {
    const authData = await requireAuth(request.headers);

    if (!authData) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (authData.isCashier) {
      return NextResponse.json(
        { message: "Only café administrators can manage customer profiles." },
        { status: 403 }
      );
    }

    if (!authData.cafe) {
      return NextResponse.json(
        { message: "Café account not found." },
        { status: 404 }
      );
    }

    const cafeId = authData.cafe.id;
    const { id } = await context.params;
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.replace(/\D/g, "")
        : "";

    const instagram =
      typeof body.instagram === "string"
        ? body.instagram
            .trim()
            .replace(/^@+/, "")
            .toLowerCase()
        : "";

    const birthday =
      typeof body.birthday === "string"
        ? body.birthday
        : "";

    if (!id || !name || !birthday) {
      return NextResponse.json(
        { message: "Name and birthday are required." },
        { status: 400 }
      );
    }

    if (!phone && !instagram) {
      return NextResponse.json(
        { message: "Enter a phone number or Instagram username." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          message: "Name must be 100 characters or fewer.",
        },
        { status: 400 }
      );
    }

    if (phone && !/^\d{11}$/.test(phone)) {
      return NextResponse.json(
        {
          message:
            "Phone number must contain exactly 11 digits.",
        },
        { status: 400 }
      );
    }

    if (
      instagram &&
      !/^[a-z0-9._]{1,30}$/.test(instagram)
    ) {
      return NextResponse.json(
        { message: "Enter a valid Instagram username." },
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
          cafeId,
        },
        select: {
          id: true,
        },
      });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    const existingContact =
      await prisma.customer.findFirst({
        where: {
          cafeId,
          NOT: {
            id,
          },
          OR: [
            ...(phone ? [{ phone }] : []),
            ...(instagram ? [{ instagram }] : []),
          ],
        },
        select: {
          id: true,
        },
      });

    if (existingContact) {
      return NextResponse.json(
        {
          message:
            "This phone number or Instagram username already belongs to another member in this café.",
        },
        { status: 409 }
      );
    }

    const updatedCustomer =
      await prisma.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: {
          name,
          phone: phone || null,
          instagram: instagram || null,
          birthday: birthdayDate,
        },
        select: {
          id: true,
          memberNumber: true,
          publicToken: true,
          name: true,
          phone: true,
          instagram: true,
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
            "This phone number or Instagram username already belongs to another member.",
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
  try {
    const authData = await requireAuth(request.headers);

    if (!authData) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (authData.isCashier) {
      return NextResponse.json(
        { message: "Only café administrators can manage customer profiles." },
        { status: 403 }
      );
    }

    if (!authData.cafe) {
      return NextResponse.json(
        { message: "Café account not found." },
        { status: 404 }
      );
    }

    const cafeId = authData.cafe.id;
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Member ID is required." },
        { status: 400 }
      );
    }

    const customer =
      await prisma.customer.findFirst({
        where: {
          id,
          cafeId,
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