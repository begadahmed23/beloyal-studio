import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function pointsMemberSearch(search: string): Prisma.CustomerWhereInput {
  if (!search) return {};
  const digits = search.replace(/[^0-9]/g, "");
  return {
    OR: [
      { memberNumber: { equals: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      ...(/^[+\d -]+$/.test(search) && digits.length >= 5 ? [{ phone: { endsWith: digits } }] : []),
    ],
  };
}

export async function pointsMemberSpending(cafeId: string, customerIds: string[]) {
  if (!customerIds.length) return new Map<string, { purchases: number; netSpending: string }>();
  const groups = await prisma.pointsTransaction.groupBy({
    by: ["customerId", "kind"],
    where: { cafeId, customerId: { in: customerIds }, kind: { in: ["PURCHASE", "REFUND"] } },
    _sum: { amount: true }, _count: { _all: true },
  });
  const amounts = new Map(groups.map(row => [`${row.customerId}:${row.kind}`, row]));
  return new Map(customerIds.map(id => {
    const purchase = amounts.get(`${id}:PURCHASE`);
    const refund = amounts.get(`${id}:REFUND`);
    return [id, {
      purchases: purchase?._count._all ?? 0,
      netSpending: purchase?._sum.amount?.minus(refund?._sum.amount ?? 0).toFixed(2) ?? "0.00",
    }];
  }));
}
