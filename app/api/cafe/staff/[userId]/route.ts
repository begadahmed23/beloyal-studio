import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { businessCashiers, getCashierLocation, StoreCapacityError, withStoreCapacity } from "@/lib/business/store-capacity";
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
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid request origin." }, 403);
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

    const toggleEnabled = body.isEnabled;
    const cafeId = authData.cafeId;
    const user = await withStoreCapacity(cafeId, async (tx, limit) => {
      const target = await tx.user.findFirst({
      where: {
        id: userId,
        ...businessCashiers(cafeId),
      },
      select: { id: true, isEnabled: true, cashierLocationId: true },
    });

    if (!target) {
      throw new StoreCapacityError("Cashier account not found.", 404);
    }

    const cashierLocationId = toggleEnabled && !target.isEnabled
      ? await getCashierLocation(tx, cafeId, limit, target.cashierLocationId ?? "", false)
      : undefined;
    return tx.user.update({
      where: { id: target.id },
      data: { isEnabled: toggleEnabled, cashierLocationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnabled: true,
      },
    });

    });
    if (!toggleEnabled) {
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });
    }

    return json({ user });
  } catch (error) {
    if (error instanceof StoreCapacityError) return json({ message: error.message }, error.status);
    console.error("Update cashier error:", error);
    return json({ message: "Failed to update cashier account." }, 500);
  }
}
