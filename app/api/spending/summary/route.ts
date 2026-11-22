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
  const query = request.nextUrl.searchParams;
  const period = ["7d", "30d", "all"].includes(query.get("period") || "") ? query.get("period")! : "30d";
  const days = period === "7d" ? 7 : 30;
  const since = period === "all" ? undefined : new Date(Date.now() - days * 86400000);
  const where = { cafeId, type: "ADD" as const, purchaseAmount: { not: null }, ...(since ? { createdAt: { gte: since } } : {}) };
  const rawLimit = Number(query.get("limit") || 10);
  const limit = [10, 25, 50, 100].includes(rawLimit) ? rawLimit : 10;
  const page = Math.min(10000, Math.max(1, Number.parseInt(query.get("page") || "1", 10) || 1));
  const search = (query.get("search") || "").trim().slice(0, 80);
  const order = query.get("order") === "oldest" ? "asc" as const : query.get("order") === "highest" ? "highest" as const : "desc" as const;
  const filteredWhere = { ...where, ...(search ? { OR: [
    { customer: { is: { name: { contains: search, mode: "insensitive" as const } } } },
    { customer: { is: { memberNumber: { contains: search, mode: "insensitive" as const } } } },
  ] } : {}) };

  const [recorded, overallCount, purchaseCount, recent, dailyTransactions] = await Promise.all([
    prisma.stampTransaction.aggregate({ where, _sum: { purchaseAmount: true } }),
    prisma.stampTransaction.count({ where }),
    prisma.stampTransaction.count({ where: filteredWhere }),
    prisma.stampTransaction.findMany({
      where: filteredWhere,
      orderBy: order === "highest" ? { purchaseAmount: "desc" } : { createdAt: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, createdAt: true, purchaseAmount: true,
        customer: { select: { name: true, memberNumber: true } },
        location: { select: { name: true } },
      },
    }),
    prisma.stampTransaction.findMany({
      where: { cafeId, type: "ADD", purchaseAmount: { not: null }, createdAt: { gte: new Date(Date.now() - (period === "all" ? 30 : days) * 86400000) } },
      select: { createdAt: true, purchaseAmount: true },
      take: 20000,
    }),
  ]);

  const daily = new Map<string, number>();
  const duration = period === "7d" ? 7 : 30;
  const cairoFormat = new Intl.DateTimeFormat("en-CA", { timeZone: auth.cafe.timezone || "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });
  for (let back = duration - 1; back >= 0; back--) {
    const d = new Date(Date.now() - back * 86400000);
    daily.set(cairoFormat.format(d), 0);
  }
  for (const item of dailyTransactions) {
    const date = cairoFormat.format(item.createdAt);
    if (daily.has(date)) daily.set(date, daily.get(date)! + (item.purchaseAmount?.toNumber() || 0));
  }

  return NextResponse.json({
    period,
    recordedSales: recorded._sum.purchaseAmount?.toNumber() ?? 0,
    recordedPurchases: overallCount,
    totalMatching: purchaseCount, page, limit,
    dailySpending: Array.from(daily, ([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 })),
    recent: recent.map(item => ({
      id: item.id, date: item.createdAt, amount: item.purchaseAmount?.toNumber() ?? 0,
      customer: item.customer.name, memberNumber: item.customer.memberNumber,
      location: item.location?.name ?? "Unassigned",
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
