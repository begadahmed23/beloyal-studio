import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type JoinRequestBody = {
  name?: unknown;
  phone?: unknown;
  birthday?: unknown;
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function createPublicToken() {
  return randomBytes(24).toString("hex");
}

function createMemberNumber() {
  const randomPart = randomBytes(4).toString("hex").toUpperCase();

  return `BL-${randomPart}`;
}

function parseBirthday(value: string) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return null;
  }

  const birthday = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(birthday.getTime())) {
    return null;
  }

  const now = new Date();

  if (birthday > now) {
    return null;
  }

  const oldestAllowedBirthday = new Date();
  oldestAllowedBirthday.setFullYear(now.getFullYear() - 120);

  if (birthday < oldestAllowedBirthday) {
    return null;
  }

  return birthday;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const body = (await request.json()) as JoinRequestBody;

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const phone =
      typeof body.phone === "string"
        ? normalizePhone(body.phone)
        : "";

    const birthdayValue =
      typeof body.birthday === "string"
        ? body.birthday.trim()
        : "";

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        {
          error: "Please enter a valid full name.",
        },
        {
          status: 400,
        }
      );
    }

    if (phone.length !== 11) {
      return NextResponse.json(
        {
          error: "Please enter a valid 11-digit phone number.",
        },
        {
          status: 400,
        }
      );
    }

    const birthday = parseBirthday(birthdayValue);

    if (!birthday) {
      return NextResponse.json(
        {
          error: "Please enter a valid birthday.",
        },
        {
          status: 400,
        }
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
      return NextResponse.json(
        {
          error: "This loyalty program is currently unavailable.",
        },
        {
          status: 404,
        }
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
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

    if (existingCustomer) {
      let token = existingCustomer.publicToken;

      if (!token) {
        token = createPublicToken();

        await prisma.customer.update({
          where: {
            id: existingCustomer.id,
          },
          data: {
            publicToken: token,
          },
        });
      }

      return NextResponse.json({
        success: true,
        existingCustomer: true,
        token,
      });
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
          throw new Error("Customer token was not created.");
        }

        return NextResponse.json(
          {
            success: true,
            existingCustomer: false,
            token: customer.publicToken,
          },
          {
            status: 201,
          }
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
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
            let token = customerCreatedByAnotherRequest.publicToken;

            if (!token) {
              token = createPublicToken();

              await prisma.customer.update({
                where: {
                  id: customerCreatedByAnotherRequest.id,
                },
                data: {
                  publicToken: token,
                },
              });
            }

            return NextResponse.json({
              success: true,
              existingCustomer: true,
              token,
            });
          }

          continue;
        }

        throw error;
      }
    }

    return NextResponse.json(
      {
        error: "We could not generate a membership number. Please try again.",
      },
      {
        status: 500,
      }
    );
  } catch (error) {
    console.error("Customer self-registration failed:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating your loyalty card.",
      },
      {
        status: 500,
      }
    );
  }
}