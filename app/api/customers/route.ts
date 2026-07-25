import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

function cleanPhone(value: unknown) {
  if (typeof value !== "string") return "";

  return value.replace(/\D/g, "");
}

function parseBirthday(value: unknown) {
  if (typeof value !== "string") return null;

  const cleanValue = value.trim();

  // Accept dd/mm/yyyy
  const europeanMatch = cleanValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (europeanMatch) {
    const day = Number(europeanMatch[1]);
    const month = Number(europeanMatch[2]);
    const year = Number(europeanMatch[3]);

    const date = new Date(
      Date.UTC(year, month - 1, day),
    );

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return date;
    }

    return null;
  }

  // Also accept yyyy-mm-dd
  const isoMatch = cleanValue.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    const date = new Date(
      Date.UTC(year, month - 1, day),
    );

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return date;
    }
  }

  return null;
}

async function generateMemberNumber(cafeId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const memberNumber = String(
      Math.floor(100000 + Math.random() * 900000),
    );

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          cafeId_memberNumber: {
            cafeId,
            memberNumber,
          },
        },
        select: {
          id: true,
        },
      });

    if (!existingCustomer) {
      return memberNumber;
    }
  }

  throw new Error(
    "Could not generate a unique member number.",
  );
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireActiveCafe(
      request.headers,
    );

    if (!access.allowed) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }

    const cafeId = access.authData.cafe.id;

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim() ?? "";

    const cleanedSearchPhone = cleanPhone(search);

    const customers = await prisma.customer.findMany({
      where: {
        cafeId,

        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                ...(cleanedSearchPhone
                  ? [
                      {
                        phone: {
                          contains: cleanedSearchPhone,
                        },
                      },
                    ]
                  : []),
                {
                  memberNumber: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        birthday: true,
        stamps: true,
        publicToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("GET customers error:", error);

    return NextResponse.json(
      { message: "Failed to load customers." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireActiveCafe(
      request.headers,
    );

    if (!access.allowed) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }

    const cafeId = access.authData.cafe.id;
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const phone = cleanPhone(body.phone);
    const birthday = parseBirthday(body.birthday);

    if (name.length < 2) {
      return NextResponse.json(
        { message: "Enter the customer’s name." },
        { status: 400 },
      );
    }

    if (phone.length !== 11) {
      return NextResponse.json(
        {
          message:
            "Phone number must contain exactly 11 digits.",
        },
        { status: 400 },
      );
    }

    if (!birthday) {
      return NextResponse.json(
        {
          message:
            "Enter a valid birthday using dd/mm/yyyy.",
        },
        { status: 400 },
      );
    }

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          cafeId_phone: {
            cafeId,
            phone,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (existingCustomer) {
      return NextResponse.json(
        {
          message:
            "This phone number is already registered at this café.",
        },
        { status: 409 },
      );
    }

    const memberNumber =
      await generateMemberNumber(cafeId);

    const customer = await prisma.customer.create({
      data: {
        cafeId,
        name,
        phone,
        birthday,
        memberNumber,
        publicToken: randomBytes(24).toString("hex"),
      },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        birthday: true,
        stamps: true,
        publicToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        customer,
        message: "Member created successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST customer error:", error);

    return NextResponse.json(
      { message: "Failed to create customer." },
      { status: 500 },
    );
  }
}