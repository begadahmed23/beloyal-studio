import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type Context = {
  params: Promise<{ userId: string }>;
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
  const authData = await requireAuth(request.headers);

  if (
    !authData ||
    authData.isSuperAdmin ||
    authData.isCashier ||
    !authData.cafeId
  ) {
    return json({ message: "Admin access required." }, 403);
  }

  const { userId } = await params;

  try {
    const body = (await request.json()) as {
      isEnabled?: unknown;
    };

    if (typeof body.isEnabled !== "boolean") {
      return json({ message: "isEnabled must be true or false." }, 400);
    }

    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "CASHIER",
        OR: [
          { cashierCafeId: authData.cafeId },
          { staffCafeId: authData.cafeId },
        ],
      },
      select: { id: true },
    });

    if (!target) {
      return json({ message: "Cashier account not found." }, 404);
    }

    const user = await prisma.user.update({
      where: { id: target.id },
      data: { isEnabled: body.isEnabled },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnabled: true,
      },
    });

    if (!body.isEnabled) {
      await prisma.session.deleteMany({
        where: { userId: target.id },
      });
    }

    return json({ user });
  } catch (error) {
    console.error("Update cashier error:", error);
    return json({ message: "Failed to update cashier account." }, 500);
  }
}
