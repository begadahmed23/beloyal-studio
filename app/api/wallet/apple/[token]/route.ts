import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPublicRateLimit, publicApiRateLimiters } from "@/lib/public-api-security";
import { appleWalletEnabled, createAppleWalletPass } from "@/lib/wallet/apple";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    if (!appleWalletEnabled()) return NextResponse.json({ message: "Apple Wallet is not available yet." }, { status: 503, headers });
    const limited = await applyPublicRateLimit(request, publicApiRateLimiters.card, "apple-wallet");
    if (limited) return limited;
    const { token } = await context.params;
    if (!/^[a-f0-9]{48}$/i.test(token)) return NextResponse.json({ message: "Card not found." }, { status: 404, headers });
    const member = await prisma.customer.findFirst({
      where: { publicToken: token, cafe: { isActive: true } },
      select: { id: true, publicToken: true, memberNumber: true, name: true,
        cafe: { select: { name: true, primaryColor: true, backgroundColor: true } } },
    });
    if (!member) return NextResponse.json({ message: "Card not found." }, { status: 404, headers });
    const pass = await createAppleWalletPass(member);
    return new NextResponse(new Uint8Array(pass), { headers: { ...headers,
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": 'attachment; filename="BeLoyal.pkpass"' } });
  } catch {
    // Never log signing material or bearer card tokens.
    console.error("Apple Wallet pass generation failed.");
    return NextResponse.json({ message: "Could not create your Wallet card. Please try again." }, { status: 500, headers });
  }
}
