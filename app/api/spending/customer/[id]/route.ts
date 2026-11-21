import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request.headers);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (auth.isCashier) return NextResponse.json({ message: "Business admins only" }, { status: 403 });
  if (!auth.cafe) return NextResponse.json({ message: "Business not found" }, { status: 404 });
  if (!/loretto/i.test(auth.cafe.slug) && !/loretto/i.test(auth.cafe.name)) {
    return NextResponse.json({ message: "Spending pilot unavailable" }, { status: 404 });
  }
  const { id } = await context.params;
  const customer = await prisma.customer.findFirst({ where: { id, cafeId: auth.cafe.id }, select: { id: true } });
  if (!customer) return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  const where = { customerId: id, cafeId: auth.cafe.id, type: "ADD" as const, purchaseAmount: { not: null } };
  const [summary, recent] = await Promise.all([
    prisma.stampTransaction.aggregate({ where, _sum: { purchaseAmount: true }, _count: { id: true } }),
    prisma.stampTransaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, createdAt: true, purchaseAmount: true, location: { select: { name: true } } } }),
  ]);
  return NextResponse.json({
    total: summary._sum.purchaseAmount?.toNumber() ?? 0,
    purchaseCount: summary._count.id,
    recent: recent.map(item => ({ id: item.id, date: item.createdAt, amount: item.purchaseAmount?.toNumber() ?? 0, location: item.location?.name ?? "Unassigned" })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
