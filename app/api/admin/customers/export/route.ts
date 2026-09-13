import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatDate(value: Date | null) {
  return value ? value.toISOString() : "";
}

export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (
      !authData ||
      authData.isSuperAdmin ||
      authData.isCashier ||
      !authData.cafeId ||
      !authData.cafe
    ) {
      return NextResponse.json(
        { message: "Customer export is only available to café administrators." },
        { status: 403 },
      );
    }

    const ids = request.nextUrl.searchParams
      .get("ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const customers = await prisma.customer.findMany({
      where: {
        cafeId: authData.cafeId,
        ...(ids?.length
          ? {
              id: {
                in: ids.slice(0, 1000),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        instagram: true,
        birthday: true,
        stamps: true,
        rewardEarnedAt: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            type: true,
            createdAt: true,
          },
        },
      },
    });

    const header = [
      "customer_id",
      "member_number",
      "name",
      "phone",
      "instagram",
      "birthday",
      "current_stamps",
      "total_visits",
      "rewards_redeemed",
      "last_visit_at",
      "reward_ready",
      "joined_at",
      "updated_at",
    ];

    const rows = customers.map((customer) => {
      const visits = customer.transactions.filter(
        (transaction) => transaction.type === "ADD",
      );
      const rewardsRedeemed = customer.transactions.filter(
        (transaction) => transaction.type === "REDEEM",
      ).length;

      return [
        customer.id,
        customer.memberNumber,
        customer.name,
        customer.phone,
        customer.instagram,
        formatDate(customer.birthday),
        customer.stamps,
        visits.length,
        rewardsRedeemed,
        formatDate(visits[0]?.createdAt ?? null),
        customer.rewardEarnedAt ? "yes" : "no",
        formatDate(customer.createdAt),
        formatDate(customer.updatedAt),
      ];
    });

    const csv = [
      header.map(csvCell).join(","),
      ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\n");

    const safeSlug =
      authData.cafe.slug.replace(/[^a-z0-9-]/gi, "-") || "business";

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="${safeSlug}-customers.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin customer export error:", error);

    return NextResponse.json(
      { message: "Failed to export customers." },
      { status: 500 },
    );
  }
}
