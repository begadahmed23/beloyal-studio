import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-super-admin";

type Context = {
  params: Promise<{ cafeId: string; userId: string }>;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: Context,
) {
  const admin = await requireSuperAdmin(request.headers);

  if (!admin) {
    return json({ message: "Forbidden." }, 403);
  }

  const { cafeId, userId } = await params;

  try {
    const body = (await request.json()) as {
      isEnabled?: unknown;
      role?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };

    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: ["CAFE_ADMIN", "CASHIER"] },
        OR: [
          { cafeId },
          { cashierCafeId: cafeId },
          { staffCafeId: cafeId },
        ],
      },
      select: { id: true },
    });

    if (!target) {
      return json({ message: "Account not found." }, 404);
    }

    const data: {
      isEnabled?: boolean;
      role?: "CAFE_ADMIN" | "CASHIER";
    } = {};

    const wantsPasswordReset =
      "newPassword" in body || "confirmPassword" in body;

    if (wantsPasswordReset) {
      const newPassword =
        typeof body.newPassword === "string"
          ? body.newPassword
          : "";
      const confirmPassword =
        typeof body.confirmPassword === "string"
          ? body.confirmPassword
          : "";

      const isStrongPassword =
        newPassword.length >= 12 &&
        newPassword.length <= 128 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /[0-9]/.test(newPassword);

      if (!isStrongPassword) {
        return json(
          {
            message:
              "Password must be 12–128 characters with uppercase, lowercase, and a number.",
          },
          400,
        );
      }

      if (newPassword !== confirmPassword) {
        return json({ message: "The passwords do not match." }, 400);
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.$transaction(async (tx) => {
        const updated = await tx.account.updateMany({
          where: {
            userId: target.id,
            providerId: "credential",
          },
          data: { password: passwordHash },
        });

        if (updated.count !== 1) {
          throw new Error(
            "The password account could not be found.",
          );
        }

        await tx.session.deleteMany({
          where: { userId: target.id },
        });
      });
    }

    if ("isEnabled" in body) {
      if (typeof body.isEnabled !== "boolean") {
        return json({ message: "isEnabled must be true or false." }, 400);
      }
      data.isEnabled = body.isEnabled;
    }

    if ("role" in body) {
      if (body.role !== "CAFE_ADMIN" && body.role !== "CASHIER") {
        return json({ message: "Invalid role." }, 400);
      }
      data.role = body.role;
    }

    if (Object.keys(data).length === 0 && !wantsPasswordReset) {
      return json({ message: "No account changes supplied." }, 400);
    }

    const user =
      Object.keys(data).length > 0
        ? await prisma.user.update({
      where: { id: target.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnabled: true,
      },
    })
        : await prisma.user.findUniqueOrThrow({
            where: { id: target.id },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isEnabled: true,
            },
          });

    if (data.isEnabled === false) {
      await prisma.session.deleteMany({
        where: { userId: target.id },
      });
    }

    return json({
      user,
      message: wantsPasswordReset
        ? "Password changed and existing sessions revoked."
        : "Account updated.",
    });
  } catch (error) {
    console.error("Studio update staff error:", error);
    return json({ message: "Failed to update account." }, 500);
  }
}
