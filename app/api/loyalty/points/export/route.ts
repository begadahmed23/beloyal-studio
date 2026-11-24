import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";

function csvText(value: unknown) {
  const text = String(value ?? "");
  const escaped = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + escaped.replaceAll('"', '""') + '"';
}

export async function GET(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);
  if (!access.allowed) return NextResponse.json({ message: access.message }, { status: access.status });
  const { user, cafe, cafeId } = access.authData;
  if (user.role !== "CAFE_ADMIN" || !cafeId || cafe?.loyaltyMode !== "POINTS") {
    return NextResponse.json({ message: "Points administrator access required." }, { status: 403 });
  }
  const customerId = request.nextUrl.searchParams.get("customer");
  const profiles = request.nextUrl.searchParams.get("view") === "customers" && !customerId;
  const headers = profiles
    ? "member_number,name,birthday,registration_branch,current_points,points_earned,points_redeemed,points_reversed,recorded_spending_egp,joined_at"
    : "transaction_id,timestamp,member_number,member_name,branch,staff,kind,amount_egp,points_change,balance_after,receipt,reward,refund_of,reason";
  const encoder = new TextEncoder();
  let cursor: string | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(encoder.encode("\uFEFF" + headers + "\r\n")); },
    async pull(controller) {
      try {
        const page = { orderBy: { id: "asc" as const }, take: 500, ...(cursor && { cursor: { id: cursor }, skip: 1 }) };
        let lines: string[];
        if (profiles) {
          const customers = await prisma.customer.findMany({
            ...page, where: { cafeId }, select: { id: true, name: true, memberNumber: true,
              birthday: true, createdAt: true, pointsBalance: true, joinLocation: { select: { name: true } } },
          });
          cursor = customers.at(-1)?.id;
          const totals = await prisma.pointsTransaction.groupBy({
            by: ["customerId", "kind"], where: { cafeId, customerId: { in: customers.map(item => item.id) } },
            _sum: { delta: true, amount: true },
          });
          const groups = new Map(totals.map(row => [row.customerId + row.kind, row._sum]));
          lines = customers.map(item => {
            const buy = groups.get(item.id + "PURCHASE");
            const redeem = groups.get(item.id + "REDEMPTION");
            const refund = groups.get(item.id + "REFUND");
            return [
              csvText(item.memberNumber), csvText(item.name), item.birthday.toISOString().slice(0, 10),
              csvText(item.joinLocation?.name), item.pointsBalance.toFixed(), buy?.delta?.toFixed() ?? "0",
              redeem?.delta?.abs().toFixed() ?? "0", refund?.delta?.abs().toFixed() ?? "0",
              buy?.amount?.minus(refund?.amount ?? 0).toFixed(2) ?? "0.00", item.createdAt.toISOString(),
            ].join(",");
          });
        } else {
          const rows = await prisma.pointsTransaction.findMany({
            ...page, where: { cafeId, ...(customerId && { customerId }) }, include: {
              customer: { select: { name: true, memberNumber: true } }, location: { select: { name: true } },
            },
          });
          cursor = rows.at(-1)?.id;
          lines = rows.map(row => [
            csvText(row.id), row.createdAt.toISOString(), csvText(row.customer.memberNumber), csvText(row.customer.name),
            csvText(row.location.name), csvText(row.actorName), row.kind, row.amount?.toFixed(2) ?? "",
            row.delta.toFixed(), row.balanceAfter.toFixed(), csvText(row.receipt), csvText(row.rewardName),
            csvText(row.purchaseId), csvText(row.reason),
          ].join(","));
        }
        if (lines.length) controller.enqueue(encoder.encode(lines.join("\r\n") + "\r\n"));
        if (lines.length < 500) controller.close();
      } catch (error) { controller.error(error); }
    },
  });
  return new NextResponse(stream, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${profiles ? "points-customers" : "points-ledger"}.csv"`,
    "Cache-Control": "private, no-store",
  } });
}
