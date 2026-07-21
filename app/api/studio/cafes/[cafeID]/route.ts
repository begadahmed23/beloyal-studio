import { NextRequest, NextResponse } from "next/server";
import {
  CafeTheme,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-super-admin";

type RouteContext = {
  params: Promise<{ cafeID: string }>;
};

const selectCafe = {
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
  rewardDescription: true,
  minimumPurchaseAmount: true,
  eligiblePurchaseDescription: true,
  whatsappBusinessNumber: true,
  whatsappEnabled: true,
  subscriptionStatus: true,
  trialStartedAt: true,
  trialEndsAt: true,
  subscriptionStartedAt: true,
  subscriptionEndsAt: true,
  lastPaymentAt: true,
  nextReminderAt: true,
  reminderSentAt: true,
  monthlyPrice: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  _count: {
    select: {
      customers: true,
      transactions: true,
    },
  },
} satisfies Prisma.CafeSelect;

type CafeResult = Prisma.CafeGetPayload<{
  select: typeof selectCafe;
}>;

function normalizeCafe(cafe: CafeResult) {
  return {
    ...cafe,
    monthlyPrice: cafe.monthlyPrice?.toNumber() ?? null,
    minimumPurchaseAmount:
      cafe.minimumPurchaseAmount?.toNumber() ?? null,
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionalText(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const text = value.trim();
  return text ? text : null;
}

function requiredText(value: unknown) {
  if (typeof value !== "string") return undefined;

  const text = value.trim();
  return text ? text : undefined;
}

function nullableDate(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function nullableDecimal(value: unknown) {
  if (value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return new Prisma.Decimal(parsed);
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  try {
    const { cafeID } = await params;

    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeID },
      select: selectCafe,
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cafe: normalizeCafe(cafe),
    });
  } catch (error) {
    console.error("GET Studio café error:", error);

    return NextResponse.json(
      { message: "Failed to load café." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  try {
    const { cafeID } = await params;
    const body = await request.json();

    const existing = await prisma.cafe.findUnique({
      where: { id: cafeID },
      select: {
        id: true,
        slug: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Café not found." },
        { status: 404 }
      );
    }

    const data: Prisma.CafeUpdateInput = {};

    if ("name" in body) {
      const value = requiredText(body.name);

      if (!value) {
        return NextResponse.json(
          { message: "Café name is required." },
          { status: 400 }
        );
      }

      data.name = value;
    }

    if ("slug" in body) {
      const value = requiredText(body.slug);
      const slug = value ? slugify(value) : "";

      if (!slug) {
        return NextResponse.json(
          { message: "Enter a valid slug." },
          { status: 400 }
        );
      }

      const duplicate = await prisma.cafe.findFirst({
        where: {
          slug,
          NOT: { id: cafeID },
        },
        select: { id: true },
      });

      if (duplicate) {
        return NextResponse.json(
          { message: "This slug is already in use." },
          { status: 409 }
        );
      }

      data.slug = slug;
    }

    if ("logoUrl" in body) {
      const value = optionalText(body.logoUrl);

      if (value === undefined) {
        return NextResponse.json(
          { message: "Logo URL must be text." },
          { status: 400 }
        );
      }

      data.logoUrl = value;
    }

    if ("theme" in body) {
      if (
        typeof body.theme !== "string" ||
        !Object.values(CafeTheme).includes(
          body.theme as CafeTheme
        )
      ) {
        return NextResponse.json(
          { message: "Invalid café theme." },
          { status: 400 }
        );
      }

      data.theme = body.theme as CafeTheme;
    }

    for (const field of [
      "primaryColor",
      "secondaryColor",
      "backgroundColor",
    ] as const) {
      if (field in body) {
        const value = requiredText(body[field]);

        if (!value) {
          return NextResponse.json(
            { message: `${field} is required.` },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    if ("rewardTarget" in body) {
      const value = Number(body.rewardTarget);

      if (
        !Number.isInteger(value) ||
        value < 2 ||
        value > 30
      ) {
        return NextResponse.json(
          {
            message:
              "Reward target must be between 2 and 30.",
          },
          { status: 400 }
        );
      }

      data.rewardTarget = value;
    }

    if ("rewardName" in body) {
      const value = requiredText(body.rewardName);

      if (!value) {
        return NextResponse.json(
          { message: "Reward name is required." },
          { status: 400 }
        );
      }

      data.rewardName = value;
    }

    for (const field of [
      "rewardDescription",
      "eligiblePurchaseDescription",
      "whatsappBusinessNumber",
    ] as const) {
      if (field in body) {
        const value = optionalText(body[field]);

        if (value === undefined) {
          return NextResponse.json(
            { message: `${field} must be text.` },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    for (const field of [
      "minimumPurchaseAmount",
      "monthlyPrice",
    ] as const) {
      if (field in body) {
        const value = nullableDecimal(body[field]);

        if (value === undefined) {
          return NextResponse.json(
            {
              message:
                `${field} must be zero or greater.`,
            },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    for (const field of [
      "whatsappEnabled",
      "isActive",
    ] as const) {
      if (field in body) {
        if (typeof body[field] !== "boolean") {
          return NextResponse.json(
            { message: `${field} must be true or false.` },
            { status: 400 }
          );
        }

        data[field] = body[field];
      }
    }

    if ("subscriptionStatus" in body) {
      if (
        typeof body.subscriptionStatus !== "string" ||
        !Object.values(SubscriptionStatus).includes(
          body.subscriptionStatus as SubscriptionStatus
        )
      ) {
        return NextResponse.json(
          { message: "Invalid subscription status." },
          { status: 400 }
        );
      }

      data.subscriptionStatus =
        body.subscriptionStatus as SubscriptionStatus;
    }

    for (const field of [
      "trialStartedAt",
      "trialEndsAt",
      "subscriptionStartedAt",
      "subscriptionEndsAt",
      "lastPaymentAt",
      "nextReminderAt",
      "reminderSentAt",
    ] as const) {
      if (field in body) {
        const value = nullableDate(body[field]);

        if (value === undefined) {
          return NextResponse.json(
            { message: `${field} must be a valid date.` },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    const ownerName =
      "ownerName" in body
        ? requiredText(body.ownerName)
        : undefined;

    const ownerEmail =
      "ownerEmail" in body
        ? requiredText(body.ownerEmail)?.toLowerCase()
        : undefined;

    if ("ownerName" in body && !ownerName) {
      return NextResponse.json(
        { message: "Owner name is required." },
        { status: 400 }
      );
    }

    if (
      "ownerEmail" in body &&
      (!ownerEmail || !ownerEmail.includes("@"))
    ) {
      return NextResponse.json(
        { message: "Enter a valid owner email." },
        { status: 400 }
      );
    }

    if (
      (ownerName !== undefined ||
        ownerEmail !== undefined) &&
      !existing.user
    ) {
      return NextResponse.json(
        {
          message:
            "This café does not have an owner account.",
        },
        { status: 400 }
      );
    }

    if (ownerEmail && existing.user) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: ownerEmail,
          NOT: { id: existing.user.id },
        },
        select: { id: true },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            message:
              "Another account already uses this email.",
          },
          { status: 409 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.cafe.update({
        where: { id: cafeID },
        data,
      });

      if (
        existing.user &&
        (ownerName !== undefined ||
          ownerEmail !== undefined)
      ) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: {
            ...(ownerName !== undefined
              ? { name: ownerName }
              : {}),
            ...(ownerEmail !== undefined
              ? { email: ownerEmail }
              : {}),
          },
        });
      }
    });

    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeID },
      select: selectCafe,
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café could not be reloaded." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cafe: normalizeCafe(cafe),
      message: "Café updated successfully.",
    });
  } catch (error) {
    console.error("PATCH Studio café error:", error);

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "That café slug or owner email already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update café.",
      },
      { status: 500 }
    );
  }
}
