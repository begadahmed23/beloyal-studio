import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { StoreCapacityError, withStoreCapacity } from "@/lib/business/store-capacity";

const ownerInput = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().transform(value => value.toLowerCase()),
  password: z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ cafeId: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !await requireSuperAdmin(request.headers)) {
    return NextResponse.json({ message: "Studio access required." }, { status: 403 });
  }
  const input = ownerInput.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Enter the owner name, email and a strong password." }, { status: 400 });
  const { cafeId } = await params;
  try {
    const { name, email, password } = input.data;
    const passwordHash = await hashPassword(password);
    const user = await withStoreCapacity(cafeId, async tx => {
      if (await tx.user.findUnique({ where: { cafeId }, select: { id: true } })) {
        throw new StoreCapacityError("This business already has an owner.");
      }
      const id = randomUUID();
      const now = new Date();
      return tx.user.create({
        select: { id: true, name: true, email: true },
        data: { id, name, email, role: "CAFE_ADMIN", cafeId, createdAt: now, updatedAt: now,
          accounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: passwordHash, createdAt: now, updatedAt: now } } },
      });
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof StoreCapacityError) return NextResponse.json({ message: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "This email is already in use." }, { status: 409 });
    }
    console.error("Studio owner provisioning failed", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ message: "Unable to create the owner account." }, { status: 500 });
  }
}
