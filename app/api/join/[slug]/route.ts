import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  applyPublicRateLimit,
  publicApiRateLimiters,
} from "@/lib/public-api-security";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

const MAX_REQUEST_BODY_BYTES = 2_000;

const CARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const joinRequestSchema = z
  .object({
    action: z.enum(["join", "recover"]).default("join"),

    name: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .optional(),

    phone: z
      .string()
      .trim()
      .min(1)
      .max(32),

    birthday: z
      .string()
      .trim()
      .max(10)
      .optional(),
  })
  .strict();

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function createPublicToken() {
  return randomBytes(24).toString("hex");
}

function createMemberNumber() {
  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `BL-${randomPart}`;
}

function getCardCookieName(cafeSlug: string) {
  return `beloyal_card_${cafeSlug}`;
}

function parseBirthday(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const birthday = new Date(
    Date.UTC(year, month - 1, day, 12)
  );

  if (
    birthday.getUTCFullYear() !== year ||
    birthday.getUTCMonth() !== month - 1 ||
    birthday.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();

  if (birthday > now) {
    return null;
  }

  const oldestAllowedBirthday = new Date(
    Date.UTC(
      now.getUTCFullYear() - 120,
      now.getUTCMonth(),
      now.getUTCDate(),
      12
    )
  );

  if (birthday < oldestAllowedBirthday) {
    return null;
  }

  return birthday;
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function cardResponse(
  body: Record<string, unknown>,
  cafeSlug: string,
  token: string,
  status = 200
) {
  const response = NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

  response.cookies.set({
    name: getCardCookieName(cafeSlug),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CARD_COOKIE_MAX_AGE,
  });

  return response;
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
          error: "Content-Type must be application/json.",
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
          error: "Request body is too large.",
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
          error: "Request body is required.",
        },
        400
      ),
    };
  }

  if (bodySize > MAX_REQUEST_BODY_BYTES) {
    return {
      error: jsonResponse(
        {
          error: "Request body is too large.",
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
          error: "Invalid JSON request.",
        },
        400
      ),
    };
  }
}

async function ensureCustomerToken(
  customerId: string,
  currentToken: string | null
) {
  if (currentToken) {
    return currentToken;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const token = createPublicToken();

      const updatedCustomer = await prisma.customer.update({
        where: {
          id: customerId,
        },
        data: {
          publicToken: token,
        },
        select: {
          publicToken: true,
        },
      });

      if (!updatedCustomer.publicToken) {
        throw new Error("Customer token was not created.");
      }

      return updatedCustomer.publicToken;
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Customer token was not created.");
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const slugResult = slugSchema.safeParse(params.slug);

    if (!slugResult.success) {
      return jsonResponse(
        {
          error:
            "This loyalty program is currently unavailable.",
        },
        404
      );
    }

    const slug = slugResult.data;

    const rateLimitResponse = await applyPublicRateLimit(
      request,
      publicApiRateLimiters.join,
      slug
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const bodyResult = await readRequestBody(request);

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const validationResult = joinRequestSchema.safeParse(
      bodyResult.data
    );

    if (!validationResult.success) {
      return jsonResponse(
        {
          error: "Please check the information entered.",
        },
        400
      );
    }

    const { action } = validationResult.data;

    const phone = normalizePhone(
      validationResult.data.phone
    );

    if (!/^01\d{9}$/.test(phone)) {
      return jsonResponse(
        {
          error:
            "Please enter a valid Egyptian 11-digit phone number.",
        },
        400
      );
    }

    const cafe = await prisma.cafe.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!cafe || !cafe.isActive) {
      return jsonResponse(
        {
          error:
            "This loyalty program is currently unavailable.",
        },
        404
      );
    }

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          cafeId_phone: {
            cafeId: cafe.id,
            phone,
          },
        },
        select: {
          id: true,
          publicToken: true,
        },
      });

    /*
     * Recovery only opens an existing card.
     */
    if (action === "recover") {
      if (!existingCustomer) {
        return jsonResponse(
          {
            error:
              "We could not find a loyalty card with this phone number.",
          },
          404
        );
      }

      const token = await ensureCustomerToken(
        existingCustomer.id,
        existingCustomer.publicToken
      );

      return cardResponse(
        {
          success: true,
          existingCustomer: true,
          token,
        },
        slug,
        token
      );
    }

    /*
     * Registering with an existing phone opens the
     * customer's existing card.
     */
    if (existingCustomer) {
      const token = await ensureCustomerToken(
        existingCustomer.id,
        existingCustomer.publicToken
      );

      return cardResponse(
        {
          success: true,
          existingCustomer: true,
          token,
        },
        slug,
        token
      );
    }

    const name = normalizeName(
      validationResult.data.name ?? ""
    );

    if (
      name.length < 2 ||
      name.length > 80 ||
      /[\u0000-\u001F\u007F]/.test(name)
    ) {
      return jsonResponse(
        {
          error: "Please enter a valid full name.",
        },
        400
      );
    }

    const birthdayValue =
      validationResult.data.birthday ?? "";

    const birthday = parseBirthday(birthdayValue);

    if (!birthday) {
      return jsonResponse(
        {
          error: "Please enter a valid birthday.",
        },
        400
      );
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const customer = await prisma.customer.create({
          data: {
            cafeId: cafe.id,
            memberNumber: createMemberNumber(),
            publicToken: createPublicToken(),
            name,
            phone,
            birthday,
            stamps: 0,
          },
          select: {
            publicToken: true,
          },
        });

        if (!customer.publicToken) {
          throw new Error(
            "Customer token was not created."
          );
        }

        return cardResponse(
          {
            success: true,
            existingCustomer: false,
            token: customer.publicToken,
          },
          slug,
          customer.publicToken,
          201
        );
      } catch (error) {
        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const customerCreatedByAnotherRequest =
            await prisma.customer.findUnique({
              where: {
                cafeId_phone: {
                  cafeId: cafe.id,
                  phone,
                },
              },
              select: {
                id: true,
                publicToken: true,
              },
            });

          if (customerCreatedByAnotherRequest) {
            const token = await ensureCustomerToken(
              customerCreatedByAnotherRequest.id,
              customerCreatedByAnotherRequest.publicToken
            );

            return cardResponse(
              {
                success: true,
                existingCustomer: true,
                token,
              },
              slug,
              token
            );
          }

          continue;
        }

        throw error;
      }
    }

    return jsonResponse(
      {
        error:
          "We could not generate a membership number. Please try again.",
      },
      500
    );
  } catch (error) {
    console.error(
      "Customer self-registration failed:",
      error
    );

    return jsonResponse(
      {
        error:
          "Something went wrong while accessing your loyalty card.",
      },
      500
    );
  }
}