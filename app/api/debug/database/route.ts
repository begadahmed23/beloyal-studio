import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const authData = await requireAuth(request.headers);

  if (!authData || !authData.cafe || !authData.cafeId) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  let databaseHost = "unknown";
  let databaseName = "unknown";

  try {
    const parsed = new URL(databaseUrl);
    databaseHost = parsed.hostname;
    databaseName = parsed.pathname.replace(/^\//, "") || "unknown";
  } catch {
    // Keep safe fallback values if DATABASE_URL cannot be parsed.
  }

  const customerCount = await prisma.customer.count({
    where: { cafeId: authData.cafeId },
  });

  const cafe = await prisma.cafe.findUnique({
    where: { id: authData.cafeId },
    select: {
      id: true,
      name: true,
      slug: true,
      birthdayRewardsEnabled: true,
      birthdayRewardName: true,
    },
  });

  return Response.json({
    databaseHost,
    databaseName,
    cafeId: authData.cafeId,
    customerCount,
    cafe,
  });
}
