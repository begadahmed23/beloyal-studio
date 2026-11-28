import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CASHIERS_PER_STORE = 5;

export class StoreCapacityError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

export function withStoreCapacity<T>(
  cafeId: string,
  run: (tx: Prisma.TransactionClient, storeLimit: number) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    // A single business row serializes location changes and cashier provisioning.
    const [cafe] = await tx.$queryRaw<{ storeLimit: number }[]>`
      SELECT "storeLimit" FROM "Cafe" WHERE "id" = ${cafeId} FOR UPDATE
    `;
    if (!cafe) throw new StoreCapacityError("Business not found.", 404);
    return run(tx, cafe.storeLimit);
  });
}

export function businessCashiers(cafeId: string) {
  return {
    role: "CASHIER",
    OR: [
      { staffCafeId: cafeId },
      { staffCafeId: null, cashierCafeId: cafeId },
      { staffCafeId: null, cashierCafeId: null, cafeId },
    ],
  } satisfies Prisma.UserWhereInput;
}

export async function getCashierLocation(
  db: Prisma.TransactionClient,
  cafeId: string,
  limit: number,
  requestedLocation: string,
  requireSelection = true,
) {
  const cashiers = await db.user.findMany({
    where: { ...businessCashiers(cafeId), isEnabled: true },
    select: { cashierLocationId: true },
  });
  if (cashiers.length >= limit * CASHIERS_PER_STORE) {
    throw new StoreCapacityError("This business has reached its cashier account limit.");
  }
  const locations = await db.cafeLocation.findMany({
    where: { cafeId, archivedAt: null },
    select: { id: true },
  });
  if (requestedLocation && !locations.some(location => location.id === requestedLocation)) {
    throw new StoreCapacityError("Choose a branch from this business.", 400);
  }
  const available = locations.filter(location => cashiers.filter(cashier => cashier.cashierLocationId === location.id).length < CASHIERS_PER_STORE);
  if (requestedLocation) {
    if (!available.some(location => location.id === requestedLocation)) {
      throw new StoreCapacityError("This store has reached its limit of 5 active cashier accounts.");
    }
    return requestedLocation;
  }
  if (!locations.length && cashiers.length < CASHIERS_PER_STORE) return null;
  if (!requireSelection && available.length === 1) return available[0].id;
  if (!available.length) throw new StoreCapacityError("Add a store with an available cashier slot first.");
  throw new StoreCapacityError("Choose a branch for this cashier.", 400);
}
