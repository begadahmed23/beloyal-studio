import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

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
    return NextResponse.json({ locations }, { headers: { "Cache-Control": "private, no-store" } });
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

    const { count } = await prisma.cafeLocation.updateMany({
      where: { id: parsed.data.id, cafeId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (count === 0) return NextResponse.json({ message: "Active store not found." }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  }

  const parsed = locationInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a store name of up to 80 characters." }, { status: 400 });
  }

  const { name } = parsed.data;
  const location = await prisma.cafeLocation.upsert({
    where: { cafeId_name: { cafeId, name } },
    create: { cafeId, name },
    update: { archivedAt: null },
    select: locationFields,
  });
  return NextResponse.json({ location });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
