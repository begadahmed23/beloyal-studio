import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { provisioningAuth } from "@/lib/provisioning-auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-super-admin";

const TRIAL_DAYS = 14;

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  try {
    const cafes = await prisma.cafe.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        theme: true,
        primaryColor: true,
        secondaryColor: true,
        backgroundColor: true,

        rewardTarget: true,
        rewardName: true,

        subscriptionStatus: true,
        trialStartedAt: true,
        trialEndsAt: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        lastPaymentAt: true,
        monthlyPrice: true,

        isActive: true,
        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        _count: {
          select: {
            customers: true,
            transactions: true,
          },
        },
      },
    });

    const normalized = cafes.map((cafe) => ({
      ...cafe,
      monthlyPrice:
        cafe.monthlyPrice?.toNumber() ?? 0,
    }));

    const monthlyRevenue = normalized.reduce(
      (total, cafe) => {
        if (
          cafe.subscriptionStatus === "ACTIVE" &&
          cafe.isActive
        ) {
          return total + cafe.monthlyPrice;
        }

        return total;
      },
      0
    );

    const expectedRevenue = normalized.reduce(
      (total, cafe) => {
        if (
          cafe.subscriptionStatus !== "CANCELLED" &&
          cafe.subscriptionStatus !== "SUSPENDED"
        ) {
          return total + cafe.monthlyPrice;
        }

        return total;
      },
      0
    );

    return NextResponse.json({
      cafes: normalized,
      summary: {
        totalCafes: normalized.length,

        activeCafes: normalized.filter(
          (cafe) =>
            cafe.subscriptionStatus === "ACTIVE" &&
            cafe.isActive
        ).length,

        trialCafes: normalized.filter(
          (cafe) =>
            cafe.subscriptionStatus === "TRIAL"
        ).length,

        suspendedCafes: normalized.filter(
          (cafe) =>
            cafe.subscriptionStatus === "SUSPENDED" ||
            !cafe.isActive
        ).length,

        pastDueCafes: normalized.filter(
          (cafe) =>
            cafe.subscriptionStatus === "PAST_DUE"
        ).length,

        monthlyRevenue,
        expectedRevenue,
      },
    });
  } catch (error) {
    console.error("GET Studio cafés error:", error);

    return NextResponse.json(
      { message: "Failed to load cafés." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const cafeName =
      typeof body.cafeName === "string"
        ? body.cafeName.trim()
        : "";

    const requestedSlug =
      typeof body.slug === "string"
        ? body.slug.trim()
        : "";

    const ownerName =
      typeof body.ownerName === "string"
        ? body.ownerName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const rewardName =
      typeof body.rewardName === "string"
        ? body.rewardName.trim()
        : "Free Drink";

    const rewardTarget = Number(body.rewardTarget);
    const monthlyPrice = Number(body.monthlyPrice);

    const theme =
      typeof body.theme === "string"
        ? body.theme
        : "COFFEE_CLASSIC";

    if (
      !cafeName ||
      !ownerName ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          message:
            "Café name, account name, email, and password are required.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        {
          message:
            "Password must contain at least 12 characters.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(rewardTarget) ||
      rewardTarget < 2 ||
      rewardTarget > 30
    ) {
      return NextResponse.json(
        {
          message:
            "Reward target must be between 2 and 30.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(monthlyPrice) ||
      monthlyPrice < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Monthly price must be a valid positive number.",
        },
        { status: 400 }
      );
    }

    const slug = createSlug(
      requestedSlug || cafeName
    );

    if (!slug) {
      return NextResponse.json(
        { message: "A valid slug is required." },
        { status: 400 }
      );
    }

    const [existingCafe, existingUser] =
      await Promise.all([
        prisma.cafe.findUnique({
          where: {
            slug,
          },
          select: {
            id: true,
          },
        }),

        prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
          },
        }),
      ]);

    if (existingCafe) {
      return NextResponse.json(
        {
          message:
            "A café already exists with this slug.",
        },
        { status: 409 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            "An account already exists with this email.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(
      trialEndsAt.getDate() + TRIAL_DAYS
    );

    const cafe = await prisma.cafe.create({
      data: {
        name: cafeName,
        slug,

        theme:
          theme === "MODERN_MINIMAL" ||
          theme === "DARK_LUXURY" ||
          theme === "SOFT_PASTEL" ||
          theme === "ORGANIC"
            ? theme
            : "COFFEE_CLASSIC",

        rewardTarget,
        rewardName:
          rewardName || "Free Drink",

        subscriptionStatus: "TRIAL",
        trialStartedAt: now,
        trialEndsAt,
        monthlyPrice,
        isActive: true,
      },
    });

    try {
    const signup = await provisioningAuth.api.signUpEmail({
  body: {
    name: ownerName,
    email,
    password,
  },
});

      if (!signup.user) {
        throw new Error(
          "The café login account was not created."
        );
      }

      const user = await prisma.user.update({
        where: {
          id: signup.user.id,
        },
        data: {
          role: "CAFE_ADMIN",
          cafeId: cafe.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return NextResponse.json(
        {
          cafe: {
            ...cafe,
            monthlyPrice:
              cafe.monthlyPrice?.toNumber() ?? 0,
          },
          user,
        },
        { status: 201 }
      );
    } catch (accountError) {
      await prisma.cafe.delete({
        where: {
          id: cafe.id,
        },
      });

      throw accountError;
    }
  } catch (error) {
    console.error("POST Studio café error:", error);

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "That café slug or login email already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create café.",
      },
      { status: 500 }
    );
  }
}
