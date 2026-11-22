import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { isSpendingTrackingEnabled } from "@/lib/business/spending-tracking";

/**
 * Spending toward the reward currently being earned/redeemed.
 * A redemption ends the previous cycle, but purchase transactions remain
 * unchanged for lifetime analytics and downloadable reports.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireActiveCafe(request.headers);
  if (!access.allowed) return NextResponse.json({ message: access.message }, { status: access.status });
  const { authData } = access;
  if (!authData.cafe || !authData.cafeId) return NextResponse.json({ message: "Business not found." }, { status: 403 });
  if (!isSpendingTrackingEnabled(authData.cafe)) {
    return NextResponse.json({ message: "Purchase tracking unavailable." }, { status: 404 });
  }
  const { id } = await context.params;
  const customer = await prisma.customer.findFirst({
    where: { id, cafeId: authData.cafeId },
    select: { id: true },
  });
  if (!customer) return NextResponse.json({ message: "Customer not found." }, { status: 404 });

  const lastRedemption = await prisma.stampTransaction.findFirst({
    where: { cafeId: authData.cafeId, customerId: id, type: "REDEEM" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { createdAt: true },
  });
  const since = lastRedemption?.createdAt;
  const additions = await prisma.stampTransaction.aggregate({
    where: { cafeId: authData.cafeId, customerId: id, type: "ADD", ...(since ? { createdAt: { gt: since } } : {}) },
    _sum: { purchaseAmount: true },
    _count: { id: true, purchaseAmount: true },
  });
  const purchaseCount = additions._count.purchaseAmount;
  return NextResponse.json({
    cycleSpending: additions._sum.purchaseAmount?.toNumber() ?? 0,
    recordedPurchases: purchaseCount,
    stampsInCycle: additions._count.id,
    missingAmounts: additions._count.id - purchaseCount,
    since: since?.toISOString() ?? null,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
