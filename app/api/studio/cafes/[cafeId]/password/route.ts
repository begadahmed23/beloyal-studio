import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-super-admin";

type RouteContext = {
  params: Promise<{ cafeId: string }>;
};

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    value.length <= 128 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const { cafeId } = await params;
    const body: unknown = await request.json().catch(() => null);

    const newPassword =
      body &&
      typeof body === "object" &&
      "newPassword" in body &&
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      body &&
      typeof body === "object" &&
      "confirmPassword" in body &&
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        {
          message:
            "Password must be 8–128 characters and include uppercase, lowercase, and a number.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "The passwords do not match." },
        { status: 400 }
      );
    }

    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: {
        id: true,
        user: { select: { id: true, email: true } },
      },
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café not found." },
        { status: 404 }
      );
    }

    if (!cafe.user) {
      return NextResponse.json(
        { message: "This café does not have an owner login account." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      const updated = await tx.account.updateMany({
        where: {
          userId: cafe.user!.id,
          providerId: "credential",
        },
        data: { password: passwordHash },
      });

      if (updated.count !== 1) {
        throw new Error("The owner's password account could not be found.");
      }

      await tx.session.deleteMany({
        where: { userId: cafe.user!.id },
      });
    });

    return NextResponse.json({
      message: "Password changed and existing sessions revoked.",
    });
  } catch (error) {
    console.error("POST Studio café password error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to change password.",
      },
      { status: 500 }
    );
  }
}
