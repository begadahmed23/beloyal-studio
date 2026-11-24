import { dashboardPaletteSelect, dashboardPaletteUpdate, getDashboardPalette } from "@/lib/business/dashboard-palette";
import { isDashboardTheme, isRestaurantPalette } from "@/lib/cafe-theme";
import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

import { branchQuote } from "@/lib/business/points";
import { businessCashiers, StoreCapacityError, withStoreCapacity } from "@/lib/business/store-capacity";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { scheduleGoogleWalletBrandUpdate } from "@/lib/wallet/google";
import { scheduleBusinessWalletUpdate } from "@/lib/wallet/updates";

type RouteContext = {
  params: Promise<{ cafeId: string }>;
};

const selectCafe = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  theme: true,
  businessType: true,
  storeLimit: true,
  loyaltyMode: true,
  proposedBillingPeriod: true,
  primaryColor: true,
  secondaryColor: true,
  backgroundColor: true,
  ...dashboardPaletteSelect,
  rewardTarget: true,
  rewardName: true,
  rewardDescription: true,
  minimumPurchaseAmount: true,
  eligiblePurchaseDescription: true,
  googleReviewUrl: true,
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
      reviews: true,
    },
  },
  reviews: {
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      rating: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          memberNumber: true,
        },
      },
    },
  },
} satisfies Prisma.CafeSelect;

type CafeResult = Prisma.CafeGetPayload<{
  select: typeof selectCafe;
}>;

async function normalizeCafe(cafe: CafeResult) {
  const [ratingAggregate, ratingGroups] = await Promise.all([
    prisma.customerReview.aggregate({
      where: { cafeId: cafe.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.customerReview.groupBy({
      by: ["rating"],
      where: { cafeId: cafe.id },
      _count: { rating: true },
    }),
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const group of ratingGroups) {
    if (group.rating >= 1 && group.rating <= 5) {
      breakdown[group.rating as keyof typeof breakdown] =
        group._count.rating;
    }
  }

  return {
    ...cafe,
    proposedSubscriptionTotal: cafe.proposedBillingPeriod ? branchQuote(cafe.storeLimit, cafe.proposedBillingPeriod) : null,
    ...getDashboardPalette(cafe),
    monthlyPrice: cafe.monthlyPrice?.toNumber() ?? null,
    minimumPurchaseAmount:
      cafe.minimumPurchaseAmount?.toNumber() ?? null,
    reviewSummary: {
      averageRating: ratingAggregate._avg.rating ?? 0,
      totalRatings: ratingAggregate._count.rating,
      breakdown,
    },
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
    const { cafeId } = await params;

    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: selectCafe,
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cafe: await normalizeCafe(cafe),
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
    const { cafeId } = await params;
    if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
    const body = await request.json();

    const existing = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: {
        id: true,
        slug: true,
        businessType: true,
        dashboardPaletteOverride: true,
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
    if ("storeLimit" in body) {
      if (!Number.isSafeInteger(body.storeLimit) || body.storeLimit < 1 || body.storeLimit > 2147483647) {
        return NextResponse.json({ message: "Enter a valid subscribed branch count." }, { status: 400 });
      }
      data.storeLimit = body.storeLimit;
    }
    if ("proposedBillingPeriod" in body) {
      if (body.proposedBillingPeriod !== null && body.proposedBillingPeriod !== "MONTHLY" && body.proposedBillingPeriod !== "YEARLY") {
        return NextResponse.json({ message: "Choose a valid quote period." }, { status: 400 });
      }
      data.proposedBillingPeriod = body.proposedBillingPeriod;
    }

    let paymentAmount: Prisma.Decimal | null = null;
    const shouldRecordPayment = body.recordPayment === true;

    if (
      "recordPayment" in body &&
      typeof body.recordPayment !== "boolean"
    ) {
      return NextResponse.json(
        { message: "recordPayment must be true or false." },
        { status: 400 }
      );
    }

    if (shouldRecordPayment) {
      const parsedAmount = Number(body.paymentAmount);

      if (
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0
      ) {
        return NextResponse.json(
          {
            message:
              "Enter a valid payment amount greater than zero.",
          },
          { status: 400 }
        );
      }

      paymentAmount = new Prisma.Decimal(parsedAmount);
    }

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
          NOT: { id: cafeId },
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

    const theme = isDashboardTheme(body.theme) ? body.theme : undefined;
    if ("theme" in body && theme === undefined) {
      return NextResponse.json(
        { message: "Invalid café theme." },
        { status: 400 }
      );
    }

    if (isRestaurantPalette(theme) && existing.businessType !== "RESTAURANT") {
      return NextResponse.json({ message: "Choose a palette for this business type." }, { status: 400 });
    }
    const palette: Parameters<typeof dashboardPaletteUpdate>[0] = { theme };
    for (const field of ["primaryColor", "secondaryColor", "backgroundColor"] as const) {
      if (field in body) {
        const value = requiredText(body[field]);

        if (!value || !/^#[0-9a-f]{6}$/i.test(value)) {
          return NextResponse.json(
            { message: `${field} must be a six-digit hex color.` },
            { status: 400 }
          );
        }

        palette[field] = value;
      }
    }
    Object.assign(data, dashboardPaletteUpdate(palette, existing.dashboardPaletteOverride));

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
              "Reward visit must be between 2 and 30.",
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
      "googleReviewUrl",
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

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { message: "isActive must be true or false." },
          { status: 400 }
        );
      }

      data.isActive = body.isActive;
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

    await withStoreCapacity(cafeId, async (tx, previousLimit) => {
      if (typeof data.storeLimit === "number" && data.storeLimit < previousLimit) {
        const [activeBranches, activeCashiers] = await Promise.all([
          tx.cafeLocation.count({ where: { cafeId, archivedAt: null } }),
          tx.user.count({ where: { ...businessCashiers(cafeId), isEnabled: true } }),
        ]);
        if (data.storeLimit < Math.max(activeBranches, activeCashiers)) {
          throw new StoreCapacityError("The limit cannot be below the number of active stores or cashiers.");
        }
      }
      await tx.cafe.update({
        where: { id: cafeId },
        data,
      });

      if (shouldRecordPayment && paymentAmount) {
        const paidAt =
          "lastPaymentAt" in body
            ? nullableDate(body.lastPaymentAt)
            : new Date();

        await tx.payment.create({
          data: {
            cafeId,
            amount: paymentAmount,
            paidAt:
              paidAt instanceof Date
                ? paidAt
                : new Date(),
            note: "Monthly subscription payment",
          },
        });
      }

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
      where: { id: cafeId },
      select: selectCafe,
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café could not be reloaded." },
        { status: 500 }
      );
    }

    if (["name", "logoUrl"].some((field) => field in data)) {
      scheduleGoogleWalletBrandUpdate(cafe);
    }
    if (["name", "logoUrl", "rewardName", "rewardTarget", "rewardDescription", "eligiblePurchaseDescription"].some((field) => field in data)) {
      scheduleBusinessWalletUpdate(cafe.id);
    }

    return NextResponse.json({
      cafe: await normalizeCafe(cafe),
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

export async function DELETE(
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
    const { cafeId } = await params;
    const body: unknown = await request.json().catch(() => null);
    const confirmationName =
      body &&
      typeof body === "object" &&
      "confirmationName" in body &&
      typeof body.confirmationName === "string"
        ? body.confirmationName.trim()
        : "";

    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café not found." },
        { status: 404 }
      );
    }

    if (confirmationName !== cafe.name) {
      return NextResponse.json(
        {
          message:
            "Type the café name exactly to confirm deletion.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.stampTransaction.deleteMany({
        where: {
          OR: [
            { cafeId },
            { customer: { cafeId } },
            { user: { cafeId } },
          ],
        },
      });

      await tx.customerReview.deleteMany({
        where: { cafeId },
      });

      await tx.customer.deleteMany({
        where: { cafeId },
      });

      await tx.user.deleteMany({
        where: {
          OR: [
            { cafeId },
            { cashierCafeId: cafeId },
            { staffCafeId: cafeId },
          ],
        },
      });

      await tx.cafe.delete({
        where: { id: cafeId },
      });
    });

    return NextResponse.json({
      message: `${cafe.name} was permanently deleted.`,
    });
  } catch (error) {
    console.error("DELETE Studio café error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete café.",
      },
      { status: 500 }
    );
  }
}
