import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

function cleanPhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function parseBirthday(value: unknown) {
  if (typeof value !== "string") return null;

  const cleanValue = value.trim();
  const europeanMatch = cleanValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const isoMatch = cleanValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  const day = europeanMatch
    ? Number(europeanMatch[1])
    : isoMatch
      ? Number(isoMatch[3])
      : 0;
  const month = europeanMatch
    ? Number(europeanMatch[2])
    : isoMatch
      ? Number(isoMatch[2])
      : 0;
  const year = europeanMatch
    ? Number(europeanMatch[3])
    : isoMatch
      ? Number(isoMatch[1])
      : 0;

  if (!day || !month || !year) return null;

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

async function generateMemberNumber(cafeId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const memberNumber = String(
      Math.floor(100000 + Math.random() * 900000),
    );

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        cafeId_memberNumber: {
          cafeId,
          memberNumber,
        },
      },
      select: { id: true },
    });

    if (!existingCustomer) return memberNumber;
  }

  throw new Error("Could not generate a unique member number.");
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireActiveCafe(request.headers);

    if (!access.allowed) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }

    const cafe = access.authData.cafe;

    if (!cafe) {
      return NextResponse.json(
        { message: "Café account not found." },
        { status: 404 },
      );
    }

    const search =
      request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const cleanedSearchPhone = cleanPhone(search);

    const customers = await prisma.customer.findMany({
      where: {
        cafeId: cafe.id,
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
                  ? [{ phone: { contains: cleanedSearchPhone } }]
                  : []),
                { memberNumber: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
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
        transactions: {
          orderBy: { createdAt: "desc" },
          select: {
            type: true,
            createdAt: true,
          },
        },
      },
    });

    const result = customers.map(({ transactions, ...customer }) => {
      const lastStampedAt =
        transactions.find((transaction) => transaction.type === "ADD")
          ?.createdAt ?? null;

      const activeStampDates: Date[] = [];

      for (const transaction of transactions) {
        if (transaction.type === "REDEEM") break;

        if (transaction.type === "ADD") {
          activeStampDates.push(transaction.createdAt);
        }
      }

      const stampDates = activeStampDates
        .slice(0, customer.stamps)
        .reverse();

      return {
        ...customer,
        lastStampedAt,
        stampDates,
      };
    });

    return NextResponse.json(result);
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
    const access = await requireActiveCafe(request.headers);

    if (!access.allowed) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }

    if (!access.authData.cafeId) {
      return NextResponse.json(
        { message: "Café account required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = cleanPhone(body.phone);
    const birthday = parseBirthday(body.birthday);

    if (!name) {
      return NextResponse.json(
        { message: "Customer name is required." },
        { status: 400 },
      );
    }

    if (phone.length !== 11) {
      return NextResponse.json(
        { message: "Phone number must contain exactly 11 digits." },
        { status: 400 },
      );
    }

    if (!birthday) {
      return NextResponse.json(
        { message: "Enter a valid birthday in dd/mm/yyyy format." },
        { status: 400 },
      );
    }

    const cafeId = access.authData.cafeId;
    const existingCustomer = await prisma.customer.findFirst({
      where: { cafeId, phone },
      select: { id: true },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: "A member with this phone number already exists." },
        { status: 409 },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        cafeId,
        memberNumber: await generateMemberNumber(cafeId),
        publicToken: randomBytes(24).toString("hex"),
        name,
        phone,
        birthday,
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

    return NextResponse.json(
      {
        ...customer,
        lastStampedAt: null,
        stampDates: [],
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
