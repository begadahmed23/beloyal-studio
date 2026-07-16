import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const session = await requireAuth(request.headers);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(customers);
  } catch (error) {
    console.error("GET customers error:", error);

    return NextResponse.json(
      { message: "Failed to load members." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request.headers);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const birthday =
      typeof body.birthday === "string" ? body.birthday : "";

    if (!name || !phone || !birthday) {
      return NextResponse.json(
        {
          message: "Name, phone number, and birthday are required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{11}$/.test(phone)) {
      return NextResponse.json(
        {
          message: "Phone number must contain exactly 11 digits.",
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

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        phone,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          message: "This phone number already exists, or the member number could not be generated. Please try again.",
        },
        { status: 409 }
      );
    }

   const latestCustomer = await prisma.customer.findFirst({
  orderBy: {
    memberNumber: "desc",
  },
  select: {
    memberNumber: true,
  },
});

const latestNumber = latestCustomer
  ? Number(latestCustomer.memberNumber.replace("LTR-", ""))
  : 0;

const memberNumber = `LTR-${String(latestNumber + 1).padStart(
  6,
  "0"
)}`;

    const customer = await prisma.customer.create({
      data: {
        memberNumber,
        publicToken: nanoid(32),
        name,
        phone,
        birthday: birthdayDate,
        stamps: 0,
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

    return NextResponse.json(customer, {
      status: 201,
    });
  } catch (error) {
    console.error("POST customer error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message: "Phone number or member number already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create member." },
      { status: 500 }
    );
  }
}