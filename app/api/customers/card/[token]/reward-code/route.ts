import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { applyPublicRateLimit, publicApiRateLimiters } from "@/lib/public-api-security";
import { loyaltyTokenPattern } from "@/lib/business/loyalty-scan";
import { activeRewardWhere } from "@/lib/business/points-ledger";
import { rewardClaimLifetimeMs, rewardClaimStatus } from "@/lib/business/reward-claim";
import { StoreCapacityError, withStoreCapacity } from "@/lib/business/store-capacity";

type Context = { params: Promise<{ token: string }> };
const rewardInput = z.object({ rewardId: z.string().min(1).max(100) });

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function codeResponse(claim: { code: string; expiresAt: Date; consumedAt: Date | null }, now = new Date()) {
  return json({ code: claim.code, expiresAt: claim.expiresAt, now, status: rewardClaimStatus(claim, now) });
}

export async function POST(request: NextRequest, { params }: Context) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid request origin." }, 403);
  try {
    const limited = await applyPublicRateLimit(request, publicApiRateLimiters.card, "reward-code-issue");
    if (limited) return limited;
    const { token } = await params;
    if (!loyaltyTokenPattern.test(token)) return json({ message: "Member not found." }, 404);
    const input = rewardInput.safeParse(await request.json().catch(() => null));
    if (!input.success) return json({ message: "Choose a reward." }, 400);

    const identity = await prisma.customer.findFirst({
      where: { publicToken: token, cafe: { isActive: true, loyaltyMode: "POINTS" } },
      select: { id: true, cafeId: true },
    });
    if (!identity) return json({ message: "Member not found." }, 404);

    return await withStoreCapacity(identity.cafeId, async tx => {
      const now = new Date();
      const key = { cafeId: identity.cafeId, customerId: identity.id, rewardId: input.data.rewardId };
      const previous = await tx.pointsRewardClaim.findUnique({ where: { cafeId_customerId_rewardId: key } });
      if (previous && previous.expiresAt > now && previous.consumedAt) return codeResponse(previous, now);

      const [customer, reward] = await Promise.all([
        tx.customer.findFirst({
          where: { id: identity.id, cafeId: identity.cafeId, publicToken: token, cafe: { isActive: true, loyaltyMode: "POINTS" } },
          select: { pointsBalance: true },
        }),
        tx.pointsReward.findFirst({
          where: { id: key.rewardId, cafeId: key.cafeId, ...activeRewardWhere(now),
            locations: { some: { location: { archivedAt: null } } } },
          select: { cost: true, expiresAt: true },
        }),
      ]);
      if (!customer || !reward) return json({ message: "This reward is unavailable." }, 404);
      if (customer.pointsBalance.lt(reward.cost)) return json({ message: "You do not have enough points for this reward." }, 409);
      if (previous && previous.expiresAt > now && previous.cost.eq(reward.cost)) return codeResponse(previous, now);

      const code = randomBytes(24).toString("hex");
      const expiresAt = new Date(Math.min(now.getTime() + rewardClaimLifetimeMs, reward.expiresAt?.getTime() ?? Infinity));
      const data = { code, expiresAt, cost: reward.cost, consumedAt: null };
      const claim = await tx.pointsRewardClaim.upsert({
        where: { cafeId_customerId_rewardId: key },
        create: { ...key, ...data },
        update: data,
      });
      return codeResponse(claim, now);
    });
  } catch (error) {
    if (error instanceof StoreCapacityError) return json({ message: error.message }, error.status);
    console.error("Reward code issuance failed", error instanceof Error ? error.name : "Unknown error");
    return json({ message: "The reward code could not be prepared. Try again." }, 500);
  }
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const limited = await applyPublicRateLimit(request, publicApiRateLimiters.card, "reward-code-status");
    if (limited) return limited;
    const { token } = await params;
    const code = request.headers.get("x-reward-code");
    if (!loyaltyTokenPattern.test(token) || !code || !loyaltyTokenPattern.test(code)) {
      return json({ message: "Reward code not found." }, 404);
    }
    const claim = await prisma.pointsRewardClaim.findFirst({
      where: { code, customer: { publicToken: token, cafe: { isActive: true, loyaltyMode: "POINTS" } } },
      select: { code: true, expiresAt: true, consumedAt: true },
    });
    return claim ? codeResponse(claim) : json({ message: "Reward code not found." }, 404);
  } catch (error) {
    console.error("Reward code status failed", error instanceof Error ? error.name : "Unknown error");
    return json({ message: "The reward code status could not be checked." }, 500);
  }
}
