import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { businessCashiers, StoreCapacityError, withStoreCapacity } from "@/lib/business/store-capacity";

const locationFields = { id: true, name: true } as const;
const locationInput = z.object({
  name: z.string().trim().min(1).max(80).transform(name => name.replace(/\s+/g, " ")),
});
const removalInput = z.object({ id: z.string().regex(/^[a-z0-9]{1,40}$/) });

async function handle(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);
  if (!access.allowed) return NextResponse.json({ message: access.message }, { status: access.status });

  const { user, cafeId } = access.authData;
  if (!cafeId) {
    return NextResponse.json({ message: "Business access required." }, { status: 403 });
  }

  if (request.method === "GET") {
    const includeArchived = user.role === "CAFE_ADMIN" && request.nextUrl.searchParams.get("includeArchived") === "1";
    const locations = user.role === "CASHIER" && !user.cashierLocationId ? [] : await prisma.cafeLocation.findMany({
      where: { cafeId, ...(!includeArchived && { archivedAt: null }), ...(user.role === "CASHIER" ? { id: user.cashierLocationId! } : {}) },
      orderBy: { name: "asc" },
      select: locationFields,
    });
    const cafe = await prisma.cafe.findUniqueOrThrow({
      where: { id: cafeId },
      select: { storeLimit: true, _count: { select: { locations: { where: { archivedAt: null } } } } },
    });
    return NextResponse.json({
      locations, storeLimit: cafe.storeLimit, hasActiveStores: cafe._count.locations > 0,
    }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (user.role !== "CAFE_ADMIN") {
    return NextResponse.json({ message: "Business administrator access required." }, { status: 403 });
  }

  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (request.method === "DELETE") {
    const parsed = removalInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Choose a store to remove." }, { status: 400 });

    const { count } = await withStoreCapacity(cafeId, tx => tx.cafeLocation.updateMany({
      where: { id: parsed.data.id, cafeId, archivedAt: null },
      data: { archivedAt: new Date() },
    }));
    if (count === 0) return NextResponse.json({ message: "Active store not found." }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  }

  const parsed = locationInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a store name of up to 80 characters." }, { status: 400 });
  }

  const { name } = parsed.data;
  try {
    const location = await withStoreCapacity(cafeId, async (tx, limit) => {
      const existing = await tx.cafeLocation.findUnique({
        where: { cafeId_name: { cafeId, name } },
        select: { ...locationFields, archivedAt: true },
      });
      if (existing && !existing.archivedAt) return { id: existing.id, name: existing.name };
      const activeStores = await tx.cafeLocation.count({ where: { cafeId, archivedAt: null } });
      if (activeStores >= limit) {
        throw new StoreCapacityError("This business has reached its store limit.");
      }
      const store = await tx.cafeLocation.upsert({
        where: { cafeId_name: { cafeId, name } },
        create: { cafeId, name },
        update: { archivedAt: null },
        select: locationFields,
      });
      // A single legacy cashier used the business-wide QR before its first store was added.
      if (!activeStores) {
        const where = { ...businessCashiers(cafeId), cashierLocationId: null };
        const cashiers = await tx.user.findMany({ where, select: { id: true }, take: 2 });
        if (cashiers.length === 1) {
          await tx.user.updateMany({ where: { ...where, id: cashiers[0].id }, data: { cashierLocationId: store.id } });
        }
      }
      return store;
    });
    return NextResponse.json({ location });
  } catch (error) {
    if (error instanceof StoreCapacityError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
