import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPublicRateLimit, publicApiRateLimiters } from "@/lib/public-api-security";
import { googleWalletEnabled, createGoogleWalletLink, GoogleWalletError } from "@/lib/wallet/google";
import { getWalletNotificationSettings } from "@/lib/wallet/notification-settings";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    if (!googleWalletEnabled()) return NextResponse.json({ message: "Google Wallet is not available yet." }, { status: 503, headers });
    const limited = await applyPublicRateLimit(request, publicApiRateLimiters.card, "google-wallet");
    if (limited) return limited;
    const { token } = await context.params;
    if (!/^[a-f0-9]{48}$/i.test(token)) return NextResponse.json({ message: "Card not found." }, { status: 404, headers });
    const member = await prisma.customer.findFirst({
      where: { publicToken: token, cafe: { isActive: true } },
      select: { id: true, publicToken: true, memberNumber: true, name: true, stamps: true, pointsBalance: true, rewardEarnedAt: true, updatedAt: true,
        cafe: { select: { id: true, name: true, slug: true, theme: true, businessType: true, loyaltyMode: true, pointsPerHundred: true, rewardTarget: true, rewardName: true, updatedAt: true, primaryColor: true, secondaryColor: true, backgroundColor: true, logoUrl: true } } },
    });
    if (!member) return NextResponse.json({ message: "Card not found." }, { status: 404, headers });
    return NextResponse.json({ url: await createGoogleWalletLink(member, await getWalletNotificationSettings(member.cafe.id)) }, { headers });
  } catch (error) {
    console.error("Google Wallet pass generation failed.", error instanceof GoogleWalletError ? { stage: error.stage, status: error.status } : { stage: "unexpected" });
    return NextResponse.json({ message: "Could not create your Google Wallet card. Please try again." }, { status: 500, headers });
  }
}
