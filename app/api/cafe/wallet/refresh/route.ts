import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { scheduleBusinessWalletUpdate } from "@/lib/wallet/updates";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request.headers);
  if (!auth || auth.isCashier || auth.isSuperAdmin || !auth.cafeId) {
    return NextResponse.json({ message: "Business admins only." }, { status: 403 });
  }

  // The operation only re-synchronizes this signed-in business's saved cards.
  // It never changes the reward, stamp balances, or customer details.
  scheduleBusinessWalletUpdate(auth.cafeId);
  return NextResponse.json(
    { message: "Saved Wallet cards are being refreshed." },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
