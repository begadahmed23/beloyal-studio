import {
  timingSafeEqual,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options":
        "nosniff",
    },
  });
}

function secretsMatch(
  providedSecret: string,
  expectedSecret: string,
) {
  const providedBuffer = Buffer.from(
    providedSecret,
  );

  const expectedBuffer = Buffer.from(
    expectedSecret,
  );

  return (
    providedBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      providedBuffer,
      expectedBuffer,
    )
  );
}

function normalizeWhatsAppPhone(
  value: string,
) {
  const digits = value.replace(
    /\D/g,
    "",
  );

  if (/^01[0125]\d{8}$/.test(digits)) {
    return `20${digits.slice(1)}`;
  }

  if (/^201[0125]\d{8}$/.test(digits)) {
    return digits;
  }

  return null;
}

function parsePageSize(value: string | null) {
  if (value === null) {
    return DEFAULT_PAGE_SIZE;
  }

  const pageSize = Number(value);

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE
  ) {
    return null;
  }

  return pageSize;
}

function parseSlug(value: string | null) {
  const slug = value?.trim().toLowerCase();

  if (
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug,
    ) ||
    slug.length > 80
  ) {
    return null;
  }

  return slug;
}

function getAppOrigin(
  request: NextRequest,
) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      console.error(
        "NEXT_PUBLIC_APP_URL is invalid.",
      );
    }
  }

  return request.nextUrl.origin;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const expectedSecret =
      process.env.N8N_AUTOMATION_SECRET;

    if (!expectedSecret) {
      console.error(
        "N8N_AUTOMATION_SECRET is not configured.",
      );

      return jsonResponse(
        {
          message:
            "Automation integration is unavailable.",
        },
        503,
      );
    }

    const providedSecret =
      request.headers.get(
        "x-beloyal-automation-secret",
      ) ?? "";

    if (
      !secretsMatch(
        providedSecret,
        expectedSecret,
      )
    ) {
      return jsonResponse(
        {
          message: "Unauthorized.",
        },
        401,
      );
    }

    const slug = parseSlug(
      request.nextUrl.searchParams.get(
        "slug",
      ),
    );

    if (!slug) {
      return jsonResponse(
        {
          message:
            "A valid business slug is required.",
        },
        400,
      );
    }

    const pageSize = parsePageSize(
      request.nextUrl.searchParams.get(
        "limit",
      ),
    );

    if (pageSize === null) {
      return jsonResponse(
        {
          message:
            "Limit must be an integer between 1 and 500.",
        },
        400,
      );
    }

    const cursor =
      request.nextUrl.searchParams
        .get("cursor")
        ?.trim() || null;

    const cafe =
      await prisma.cafe.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      });

    if (!cafe || !cafe.isActive) {
      return jsonResponse(
        {
          message:
            "Business not found or inactive.",
        },
        404,
      );
    }

    const [rows, totalCustomers] =
      await Promise.all([
        prisma.customer.findMany({
          where: {
            cafeId: cafe.id,
          },
          orderBy: {
            id: "asc",
          },
          take: pageSize + 1,
          ...(cursor
            ? {
                cursor: {
                  id: cursor,
                },
                skip: 1,
              }
            : {}),
          select: {
            id: true,
            name: true,
            phone: true,
            birthday: true,
            memberNumber: true,
            publicToken: true,
            createdAt: true,
          },
        }),

        prisma.customer.count({
          where: {
            cafeId: cafe.id,
          },
        }),
      ]);

    const hasMore =
      rows.length > pageSize;

    const page = hasMore
      ? rows.slice(0, pageSize)
      : rows;

    const appOrigin =
      getAppOrigin(request);

    let skippedInvalidPhones = 0;

    const customers = page.flatMap(
      (customer) => {
        const phone =
          normalizeWhatsAppPhone(
            customer.phone,
          );

        if (!phone) {
          skippedInvalidPhones += 1;
          return [];
        }

        return [
          {
            id: customer.id,
            name: customer.name,
            phone,
            birthday: customer.birthday,
            memberNumber:
              customer.memberNumber,
            cardUrl: new URL(
              `/card/${encodeURIComponent(
                customer.publicToken,
              )}`,
              appOrigin,
            ).toString(),
            createdAt:
              customer.createdAt,
          },
        ];
      },
    );

    return jsonResponse({
      business: {
        name: cafe.name,
        slug: cafe.slug,
      },
      customers,
      pagination: {
        requestedLimit: pageSize,
        returnedCustomers:
          customers.length,
        skippedInvalidPhones,
        totalCustomers,
        hasMore,
        nextCursor: hasMore
          ? page.at(-1)?.id ?? null
          : null,
      },
    });
  } catch (error) {
    console.error(
      "GET n8n customers error:",
      error,
    );

    return jsonResponse(
      {
        message:
          "Failed to load automation customers.",
      },
      500,
    );
  }
}
