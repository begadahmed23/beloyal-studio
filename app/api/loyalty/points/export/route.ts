import { NextRequest, NextResponse } from "next/server";
import { pointsCustomerPage, pointsCustomerScope } from "@/lib/business/points-members";
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
  const customerId = request.nextUrl.searchParams.get("customer")?.slice(0, 100);
  const view = request.nextUrl.searchParams.get("view");
  const profiles = view === "customers";
  const scope = profiles ? pointsCustomerScope(cafeId, cafe.timezone, request.nextUrl.searchParams) : null;
  const headers = profiles
    ? "name,member_number,recorded_spending_egp,purchases,current_points,registration_branch"
    : "transaction_id,timestamp,member_number,member_name,branch,staff,kind,amount_egp,points_change,balance_after,receipt,reward,refund_of,reason";
  const encoder = new TextEncoder();
  let cursor: string | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(encoder.encode("\uFEFF" + headers + "\r\n")); },
    async pull(controller) {
      try {
        const page = { orderBy: { id: "asc" as const }, take: 500, ...(cursor && { cursor: { id: cursor }, skip: 1 }) };
        let lines: string[];
        if (scope) {
          const customers = await pointsCustomerPage(cafeId, scope, { after: cursor, take: 500 });
          cursor = customers.at(-1)?.id;
          lines = customers.map(item => [
            csvText(item.name), csvText(item.memberNumber), item.netSpending,
            item.purchases, item.pointsBalance.toFixed(), csvText(item.joinLocation?.name),
          ].join(","));
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
