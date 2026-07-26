import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-super-admin";

type RouteContext = {
  params: Promise<{
    cafeId: string;
  }>;
};

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value: Date | null) {
  if (!value) return "";

  return value.toISOString();
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  const admin = await requireSuperAdmin(
    request.headers,
  );

  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 },
    );
  }

  try {
    const { cafeId } = await params;

    const cafe = await prisma.cafe.findUnique({
      where: {
        id: cafeId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!cafe) {
      return NextResponse.json(
        { message: "Café not found." },
        { status: 404 },
      );
    }

    // The cafeId condition is what guarantees that only
    // this café’s customers are exported.
    const customers = await prisma.customer.findMany({
      where: {
        cafeId: cafe.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        birthday: true,
        stamps: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const header = [
      "customer_id",
      "member_number",
      "name",
      "phone",
      "birthday",
      "current_stamps",
      "total_transactions",
      "joined_at",
      "updated_at",
    ];

    const rows = customers.map((customer) => [
      customer.id,
      customer.memberNumber,
      customer.name,
      customer.phone,
      formatDate(customer.birthday),
      customer.stamps,
      customer._count.transactions,
      formatDate(customer.createdAt),
      formatDate(customer.updatedAt),
    ]);

    const csv = [
      header.map(csvCell).join(","),
      ...rows.map((row) =>
        row.map(csvCell).join(","),
      ),
    ].join("\n");

    const safeSlug =
      cafe.slug.replace(/[^a-z0-9-]/gi, "-") ||
      "cafe";

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="${safeSlug}-customers.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Studio customer export error:",
      error,
    );

    return NextResponse.json(
      { message: "Failed to export customers." },
      { status: 500 },
    );
  }
}