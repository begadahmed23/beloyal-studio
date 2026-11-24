import { after, NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { scheduleBusinessWalletUpdate } from "@/lib/wallet/updates";
import { prisma } from "@/lib/prisma";
import { fireyNashBrand } from "@/lib/business/points";
import { googleWalletEnabled, updateGoogleWalletClass } from "@/lib/wallet/google";
import { getWalletNotificationSettings } from "@/lib/wallet/notification-settings";
import { getRewardName } from "@/lib/business/terminology";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
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
    select: { id: true, name: true, slug: true, theme: true, businessType: true, logoUrl: true,
      primaryColor: true, secondaryColor: true, backgroundColor: true, rewardTarget: true, rewardName: true, updatedAt: true },
  });
  if (cafe.slug === fireyNashBrand.slug && googleWalletEnabled()) {
    after(async () => {
      try {
        await updateGoogleWalletClass(cafe, await getWalletNotificationSettings(cafe.id));
      } catch {
        console.error("Firey Nash Google Wallet branding refresh failed.");
      }
    });
  }
  scheduleBusinessWalletUpdate(cafe.id);
  return NextResponse.json(
    { message: "Wallet refresh requested.", rewardName: getRewardName(cafe), version: cafe.updatedAt.toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
