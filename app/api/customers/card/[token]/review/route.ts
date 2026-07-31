import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  applyPublicRateLimit,
  publicApiRateLimiters,
} from "@/lib/public-api-security";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

const MAX_REQUEST_BODY_BYTES = 500;

const tokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{48}$/i);

const reviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
  })
  .strict();

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type");

  if (
    !contentType ||
    !contentType.toLowerCase().includes("application/json")
  ) {
    return {
      error: jsonResponse(
        {
          message: "Content-Type must be application/json.",
        },
        415
      ),
    };
  }

  const declaredLength = Number(
    request.headers.get("content-length")
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_REQUEST_BODY_BYTES
  ) {
    return {
      error: jsonResponse(
        {
          message: "Request body is too large.",
        },
        413
      ),
    };
  }

  const rawBody = await request.text();
  const bodySize = new TextEncoder().encode(rawBody).length;

  if (bodySize === 0) {
    return {
      error: jsonResponse(
        {
          message: "Rating is required.",
        },
        400
      ),
    };
  }

  if (bodySize > MAX_REQUEST_BODY_BYTES) {
    return {
      error: jsonResponse(
        {
          message: "Request body is too large.",
        },
        413
      ),
    };
  }

  try {
    return {
      data: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      error: jsonResponse(
        {
          message: "Invalid JSON request.",
        },
        400
      ),
    };
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
     * Use an IP-based scope so changing fake tokens cannot
     * bypass the limiter and repeatedly query PostgreSQL.
     */
    const rateLimitResponse = await applyPublicRateLimit(
      request,
      publicApiRateLimiters.review,
      "customer-review"
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { token } = await context.params;
    const tokenResult = tokenSchema.safeParse(token);

    if (!tokenResult.success) {
      return jsonResponse(
        {
          message: "Customer card was not found.",
        },
        404
      );
    }

    const bodyResult = await readRequestBody(request);

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const validationResult = reviewSchema.safeParse(
      bodyResult.data
    );

    if (!validationResult.success) {
      return jsonResponse(
        {
          message:
            "Rating must be a whole number from 1 to 5.",
        },
        400
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        publicToken: tokenResult.data,

        cafe: {
          isActive: true,
        },
      },
      select: {
        id: true,
        cafeId: true,
      },
    });

    if (!customer) {
      return jsonResponse(
        {
          message: "Customer card was not found.",
        },
        404
      );
    }

    const review = await prisma.customerReview.upsert({
      where: {
        customerId: customer.id,
      },
      update: {
        rating: validationResult.data.rating,
        cafeId: customer.cafeId,
      },
      create: {
        rating: validationResult.data.rating,
        customerId: customer.id,
        cafeId: customer.cafeId,
      },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonResponse({
      message: "Thank you. Your rating has been saved.",
      review,
    });
  } catch (error) {
    console.error("Save customer review error:", error);

    return jsonResponse(
      {
        message: "Unable to save your rating right now.",
      },
      500
    );
  }
}