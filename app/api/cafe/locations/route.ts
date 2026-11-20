import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

const locationFields = { id: true, name: true } as const;
const locationInput = z.object({
  name: z.string().trim().min(1).max(80).transform(name => name.replace(/\s+/g, " ")),
});

async function handle(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);
  if (!access.allowed) return NextResponse.json({ message: access.message }, { status: access.status });

  const { user, cafeId } = access.authData;
  if (user.role !== "CAFE_ADMIN" || !cafeId) {
    return NextResponse.json({ message: "Business administrator access required." }, { status: 403 });
  }

  if (request.method === "GET") {
    const locations = await prisma.cafeLocation.findMany({
      where: { cafeId },
      orderBy: { name: "asc" },
      select: locationFields,
    });
    return NextResponse.json({ locations }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const parsed = locationInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a store name of up to 80 characters." }, { status: 400 });
  }

  const { name } = parsed.data;
  const location = await prisma.cafeLocation.upsert({
    where: { cafeId_name: { cafeId, name } },
    create: { cafeId, name },
    update: { name },
    select: locationFields,
  });
  return NextResponse.json({ location });
}

export const GET = handle;
export const POST = handle;
