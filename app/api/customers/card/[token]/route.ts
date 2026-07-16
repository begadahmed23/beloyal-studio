import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    const customer = await prisma.customer.findUnique({
      where: {
        publicToken: token,
      },
      select: {
        id: true,
        memberNumber: true,
        publicToken: true,
        name: true,
        birthday: true,
        stamps: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          message: "Loyalty card not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to load loyalty card.",
      },
      {
        status: 500,
      }
    );
  }
}