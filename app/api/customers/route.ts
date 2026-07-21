import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { requireAuth } from "@/lib/require-auth";

const CUSTOMER_SELECT = {
  id: true,
  memberNumber: true,
  publicToken: true,
  name: true,
  phone: true,
  birthday: true,
  stamps: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

function createCafePrefix(slug: string) {
  const cleanSlug = slug.replace(/[^a-zA-Z]/g, "");

  return cleanSlug.slice(0, 3).toUpperCase().padEnd(3, "X");
}

function getMemberNumberSuffix(memberNumber: string) {
  const match = memberNumber.match(/(\d+)$/);

  if (!match) {
    return 0;
  }

  return Number(match[1]) || 0;
}

function isUniqueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function getUniqueTargets(error: unknown): string[] {
  if (!isUniqueError(error)) {
    return [];
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.map(String);
  }

  if (typeof target === "string") {
    return [target];
  }

  return [];
}

export async function GET(request: NextRequest) {
  const authData = await requireAuth(request.headers);

  if (
    !authData ||
    authData.isSuperAdmin ||
    !authData.cafeId ||
    !authData.cafe
  ) {
    return NextResponse.json(
      { message: "Café account required." },
      { status: 403 },
    );
  }

  try {
    const customers = await prisma.customer.findMany({
      where: {
        cafeId: authData.cafeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: CUSTOMER_SELECT,
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("GET customers error:", error);

    return NextResponse.json(
      { message: "Failed to load members." },
      { status: 500 },
    );
  }
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

  if (authData.isSuperAdmin || !authData.cafeId || !authData.cafe) {
    return NextResponse.json(
      { message: "Café account required." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    const birthday =
      typeof body.birthday === "string" ? body.birthday.trim() : "";

    if (!name || !phone || !birthday) {
      return NextResponse.json(
        {
          message: "Name, phone number, and birthday are required.",
        },
        { status: 400 },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          message: "Name must be 100 characters or fewer.",
        },
        { status: 400 },
      );
    }

    if (!/^\d{11}$/.test(phone)) {
      return NextResponse.json(
        {
          message: "Phone number must contain exactly 11 digits.",
        },
        { status: 400 },
      );
    }

    const birthdayDate = new Date(birthday);

    if (Number.isNaN(birthdayDate.getTime())) {
      return NextResponse.json(
        { message: "Birthday is invalid." },
        { status: 400 },
      );
    }

    const existingPhone = await prisma.customer.findFirst({
      where: {
        cafeId: authData.cafeId,
        phone,
      },
      select: {
        id: true,
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          message:
            "A member already exists with this phone number in this café.",
        },
        { status: 409 },
      );
    }

    const existingNumbers = await prisma.customer.findMany({
      where: {
        cafeId: authData.cafeId,
      },
      select: {
        memberNumber: true,
      },
    });

    const highestNumber = existingNumbers.reduce((highest, customer) => {
      return Math.max(highest, getMemberNumberSuffix(customer.memberNumber));
    }, 0);

    const prefix = createCafePrefix(authData.cafe.slug);

    // Retry protects against two creation requests happening together.
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const nextNumber = highestNumber + attempt;

      const memberNumber = `${prefix}-${String(nextNumber).padStart(6, "0")}`;

      try {
        const customer = await prisma.customer.create({
          data: {
            cafeId: authData.cafeId,
            memberNumber,
            publicToken: nanoid(32),
            name,
            phone,
            birthday: birthdayDate,
            stamps: 0,
          },
          select: CUSTOMER_SELECT,
        });

        return NextResponse.json(customer, {
          status: 201,
        });
      } catch (error) {
        if (!isUniqueError(error)) {
          throw error;
        }

        const targets = getUniqueTargets(error);

        if (targets.some((target) => target.toLowerCase().includes("phone"))) {
          return NextResponse.json(
            {
              message:
                "A member already exists with this phone number in this café.",
            },
            { status: 409 },
          );
        }

        if (
          targets.some((target) => target.toLowerCase().includes("publictoken"))
        ) {
          continue;
        }

        if (
          targets.some((target) =>
            target.toLowerCase().includes("membernumber"),
          )
        ) {
          continue;
        }

        // Unknown P2002 target: retry with a new member number/token.
        continue;
      }
    }

    return NextResponse.json(
      {
        message: "The member number could not be generated. Please try again.",
      },
      { status: 409 },
    );
  } catch (error) {
    console.error("POST customer error:", error);

    return NextResponse.json(
      { message: "Failed to create member." },
      { status: 500 },
    );
  }
}
