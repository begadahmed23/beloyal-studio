import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { earnedPoints, purchaseAmountSchema } from "./points";
import { businessCashiers, StoreCapacityError, withStoreCapacity } from "./store-capacity";

const id = z.string().min(1).max(100);
const requestFields = {
  customerId: id,
  locationId: id,
  requestId: z.uuid(),
};
export const pointsEntrySchema = z.discriminatedUnion("kind", [
  z.object({ ...requestFields, kind: z.literal("PURCHASE"), amount: purchaseAmountSchema,
    receipt: z.string().trim().min(1).max(80).transform(value => value.toUpperCase()).optional() }),
  z.object({ ...requestFields, kind: z.literal("REDEMPTION"), rewardId: id }),
  z.object({ ...requestFields, kind: z.literal("REFUND"), purchaseId: id, amount: purchaseAmountSchema,
    reason: z.string().trim().min(1).max(240) }),
]);
type Entry = z.infer<typeof pointsEntrySchema>;
type Actor = { id: string; role: "CAFE_ADMIN" | "CASHIER" };

export function activeRewardWhere(now = new Date()): Prisma.PointsRewardWhereInput {
  return { enabled: true, archivedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

export function recordPointsEntry(cafeId: string, actor: Actor, entry: Entry) {
  return withStoreCapacity(cafeId, async tx => {
    const [cafe, user, location, customer] = await Promise.all([
      tx.cafe.findUniqueOrThrow({ where: { id: cafeId }, select: { loyaltyMode: true, pointsPerHundred: true } }),
      tx.user.findFirst({ where: {
        id: actor.id, isEnabled: true,
        ...(actor.role === "CASHIER" ? businessCashiers(cafeId) : { role: "CAFE_ADMIN", OR: [{ staffCafeId: cafeId }, { staffCafeId: null, cafeId }] }),
      }, select: { name: true, cashierLocationId: true } }),
      tx.cafeLocation.findFirst({ where: { id: entry.locationId, cafeId, archivedAt: null }, select: { id: true } }),
      tx.customer.findUnique({ where: { cafeId_id: { cafeId, id: entry.customerId } }, select: { pointsBalance: true } }),
    ]);
    if (cafe.loyaltyMode !== "POINTS") throw new StoreCapacityError("Points loyalty is unavailable.");
    if (!user || (actor.role === "CASHIER" && (entry.kind === "REFUND" || user.cashierLocationId !== entry.locationId))) {
      throw new StoreCapacityError("You cannot process this transaction.", 403);
    }
    if (!customer) throw new StoreCapacityError("Member not found.", 404);

    const requestHash = createHash("sha256").update(JSON.stringify([actor.id, entry])).digest("hex");
    const previous = await tx.pointsTransaction.findUnique({ where: { cafeId_requestId: { cafeId, requestId: entry.requestId } } });
    if (previous) {
      if (previous.requestHash !== requestHash) throw new StoreCapacityError("That request has already been used.");
      return { entry: previous, balance: customer.pointsBalance, replay: true };
    }
    if (!location) throw new StoreCapacityError("Choose an active branch.", 400);

    const details: Pick<Prisma.PointsTransactionUncheckedCreateInput, "amount" | "receipt" | "pointsPerHundred" | "rewardId" | "rewardName" | "rewardSnapshot" | "purchaseId" | "reason"> = {};
    let delta: Prisma.Decimal;

    if (entry.kind === "PURCHASE") {
      if (entry.receipt && await tx.pointsTransaction.findUnique({
        where: { cafeId_locationId_receipt: { cafeId, locationId: entry.locationId, receipt: entry.receipt } },
        select: { id: true },
      })) throw new StoreCapacityError("This receipt is already recorded at this branch.");
      details.amount = entry.amount;
      details.receipt = entry.receipt;
      details.pointsPerHundred = cafe.pointsPerHundred;
      delta = new Prisma.Decimal(earnedPoints(entry.amount, cafe.pointsPerHundred.toFixed()));
    } else if (entry.kind === "REDEMPTION") {
      const reward = await tx.pointsReward.findFirst({
        where: { cafeId, id: entry.rewardId, ...activeRewardWhere(),
          locations: { some: { locationId: entry.locationId, location: { archivedAt: null } } } },
        select: { name: true, cost: true, description: true, conditions: true, photoUrl: true, expiresAt: true },
      });
      if (!reward) throw new StoreCapacityError("This reward is unavailable at this branch.");
      details.rewardId = entry.rewardId;
      details.rewardName = reward.name;
      details.rewardSnapshot = { ...reward, cost: reward.cost.toFixed(), expiresAt: reward.expiresAt?.toISOString() ?? null };
      delta = reward.cost.negated();
    } else {
      const purchase = await tx.pointsTransaction.findFirst({
        where: { cafeId, id: entry.purchaseId, customerId: entry.customerId, kind: "PURCHASE" },
        select: { amount: true, delta: true, pointsPerHundred: true },
      });
      if (!purchase?.amount || !purchase.pointsPerHundred) throw new StoreCapacityError("Purchase not found.", 404);
      const { _sum } = await tx.pointsTransaction.aggregate({
        where: { cafeId, purchaseId: entry.purchaseId, kind: "REFUND" },
        _sum: { amount: true, delta: true },
      });
      const refunded = new Prisma.Decimal(_sum.amount ?? 0).plus(entry.amount);
      if (refunded.gt(purchase.amount)) throw new StoreCapacityError("Refund exceeds the remaining purchase amount.");
      const cumulative = refunded.equals(purchase.amount) ? purchase.delta
        : new Prisma.Decimal(earnedPoints(refunded.toFixed(2), purchase.pointsPerHundred.toFixed()));
      delta = cumulative.plus(_sum.delta ?? 0).negated();
      details.amount = entry.amount;
      details.purchaseId = entry.purchaseId;
      details.reason = entry.reason;
    }

    const balance = customer.pointsBalance.plus(delta);
    if (balance.isNegative() && !balance.isZero()) throw new StoreCapacityError("The member has insufficient points.");
    if (balance.gte("1000000000000")) throw new StoreCapacityError("The balance exceeds the supported limit.");
    await tx.customer.update({
      where: { cafeId_id: { cafeId, id: entry.customerId } },
      data: { pointsBalance: balance },
    });
    const result = await tx.pointsTransaction.create({
      data: { ...details, cafeId, customerId: entry.customerId, locationId: location.id, actorId: actor.id,
        actorName: user.name, kind: entry.kind, delta, balanceAfter: balance, requestId: entry.requestId, requestHash },
    });
    return { entry: result, balance, replay: false };
  });
}
