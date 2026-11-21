import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request.headers);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (auth.isCashier) return NextResponse.json({ message: "Business administrators only" }, { status: 403 });
  if (!auth.cafe) return NextResponse.json({ message: "Business not found" }, { status: 404 });
  if (!/loretto/i.test(auth.cafe.slug) && !/loretto/i.test(auth.cafe.name)) {
    return NextResponse.json({ message: "Spending pilot unavailable" }, { status: 404 });
  }

  const cafeId = auth.cafe.id;
  const period = request.nextUrl.searchParams.get("period") === "all" ? "all" : "30d";
  const since = period === "all" ? undefined : new Date(Date.now() - 30 * 86400000);
  const where = { cafeId, type: "ADD" as const, ...(since ? { createdAt: { gte: since } } : {}) };
  const [allStamps, recorded, grouped, recent] = await Promise.all([
    prisma.stampTransaction.count({ where }),
    prisma.stampTransaction.aggregate({
      where: { ...where, purchaseAmount: { not: null } },
      _sum: { purchaseAmount: true }, _avg: { purchaseAmount: true }, _count: { id: true },
    }),
    prisma.stampTransaction.groupBy({
      by: ["customerId"], where: { ...where, purchaseAmount: { not: null } },
      _count: { id: true }, _sum: { purchaseAmount: true },
    }),
    prisma.stampTransaction.findMany({
      where: { ...where, purchaseAmount: { not: null } },
      orderBy: { createdAt: "desc" }, take: 15,
      select: { id: true, createdAt: true, purchaseAmount: true, customer: { select: { name: true, memberNumber: true } }, location: { select: { name: true } } },
    }),
  ]);
  return NextResponse.json({
    period,
    recordedSales: recorded._sum.purchaseAmount?.toNumber() ?? 0,
    averagePurchase: recorded._avg.purchaseAmount?.toNumber() ?? 0,
    recordedCount: recorded._count.id,
    allStamps,
    repeatSpenders: grouped.filter(group => group._count.id >= 2).length,
    recent: recent.map(item => ({ id: item.id, date: item.createdAt, amount: item.purchaseAmount?.toNumber(), customer: item.customer.name, memberNumber: item.customer.memberNumber, location: item.location?.name ?? "Unassigned" })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
