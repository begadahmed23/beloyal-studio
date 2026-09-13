import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { provisioningAuth } from "@/lib/provisioning-auth";
import { requireSuperAdmin } from "@/lib/require-super-admin";

type Context = {
  params: Promise<{ cafeId: string }>;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function strongPassword(value: string) {
  return (
    value.length >= 12 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export async function GET(
  request: NextRequest,
  { params }: Context,
) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return json({ message: "Forbidden." }, 403);
  }

  const { cafeId } = await params;

  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: { id: true, name: true },
  });

  if (!cafe) {
    return json({ message: "Business not found." }, 404);
  }

  const [users, activity] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["CAFE_ADMIN", "CASHIER"] },
        OR: [
          { cafeId },
          { cashierCafeId: cafeId },
          { staffCafeId: cafeId },
        ],
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnabled: true,
        createdAt: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        _count: { select: { transactions: true } },
      },
    }),
    prisma.stampTransaction.findMany({
      where: {
        cafeId,
        userId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
      },
    }),
  ]);

  return json({
    business: cafe,
    staff: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEnabled: user.isEnabled,
      createdAt: user.createdAt,
      lastActivityAt: user.transactions[0]?.createdAt ?? null,
      activityCount: user._count.transactions,
      isCurrentUser: false,
    })),
    activity,
  });
}

export async function POST(
  request: NextRequest,
  { params }: Context,
) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return json({ message: "Forbidden." }, 403);
  }

  const { cafeId } = await params;

  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
    };

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const role =
      body.role === "CAFE_ADMIN" || body.role === "CASHIER"
        ? body.role
        : null;

    if (!name || name.length > 80) {
      return json({ message: "Enter a valid account name." }, 400);
    }

    if (!email || !email.includes("@") || email.length > 320) {
      return json({ message: "Enter a valid email." }, 400);
    }

    if (!role) {
      return json({ message: "Select Admin or Cashier." }, 400);
    }

    if (!strongPassword(password)) {
      return json(
        {
          message:
            "Password must be at least 12 characters with uppercase, lowercase, and a number.",
        },
        400,
      );
    }

    const [cafe, existing] = await Promise.all([
      prisma.cafe.findUnique({
        where: { id: cafeId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
    ]);

    if (!cafe) {
      return json({ message: "Business not found." }, 404);
    }

    if (existing) {
      return json(
        { message: "An account already exists with this email." },
        409,
      );
    }

    const signup = await provisioningAuth.api.signUpEmail({
      body: { name, email, password },
    });

    if (!signup.user) {
      throw new Error("Account was not created.");
    }

    const user = await prisma.user.update({
      where: { id: signup.user.id },
      data: {
        role,
        staffCafeId: cafeId,
        cafeId: null,
        cashierCafeId: null,
        isEnabled: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnabled: true,
        createdAt: true,
      },
    });

    return json({ user }, 201);
  } catch (error) {
    console.error("Studio create staff error:", error);
    return json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create account.",
      },
      500,
    );
  }
}
