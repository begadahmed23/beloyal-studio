import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { scheduleBusinessWalletUpdate } from "@/lib/wallet/updates";
import { prisma } from "@/lib/prisma";
import { getRewardName } from "@/lib/business/terminology";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request.headers);
  if (!auth || auth.isCashier || auth.isSuperAdmin || !auth.cafeId) {
    return NextResponse.json({ message: "Business admins only." }, { status: 403 });
  }

  // The operation only re-synchronizes this signed-in business's saved cards.
  // It never changes the reward, stamp balances, or customer details.
  // Apple Wallet compares its saved update tag against the modified date.
  // A push alone does not change that date, so the device can respond with
  // "nothing changed" and keep displaying the old reward indefinitely.
  // Bump the business version before notifying installed passes.
  const cafe = await prisma.cafe.update({
    where: { id: auth.cafeId },
    data: { updatedAt: new Date() },
    select: { id: true, businessType: true, rewardName: true, updatedAt: true },
  });
  scheduleBusinessWalletUpdate(cafe.id);
  return NextResponse.json(
    { message: "Wallet refresh requested.", rewardName: getRewardName(cafe), version: cafe.updatedAt.toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
