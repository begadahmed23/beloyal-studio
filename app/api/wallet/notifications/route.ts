import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { walletCampaignsEnabledForCafe } from "@/lib/wallet/campaign-access";
import { walletUpdatesEnabled } from "@/lib/wallet/config";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import { getWalletNotificationSettings, saveWalletNotificationSettings } from "@/lib/wallet/notification-settings";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const suffix = z.string().trim().max(100).refine(value => !/[\u0000-\u001f]/.test(value), "Use a single line of text.");
const schema = z.object({ cafeId: z.string().min(1).max(100), stampSuffix: suffix, rewardSuffix: suffix, resetSuffix: suffix.optional(),
  nearbyEnabled: z.boolean().optional(), nearbyMessage: suffix.optional(),
  nearbyLatitude: z.number().finite().min(-90).max(90).nullable().optional(),
  nearbyLongitude: z.number().finite().min(-180).max(180).nullable().optional(),
  nearbyMaxDistance: z.number().int().min(50).max(1000).nullable().transform(value => value ?? 150).optional(),
}).strict();
async function handle(request: NextRequest) {
  const auth = await requireAuth(request.headers);
  if (!auth || auth.isCashier || !["CAFE_ADMIN", "SUPER_ADMIN"].includes(auth.user.role)) return json({ message: "Administrator access required." }, 403);
  if (!auth.isSuperAdmin) {
    const access = await requireActiveCafe(request.headers);
    if (!access.allowed) return json({ message: access.message }, access.status);
  }
  if (request.method === "POST" && request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid request origin." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return json({ message: "Request too large." }, 413);
  const body = request.method === "POST" ? await request.json() : null;
  const cafeId = body?.cafeId ?? request.nextUrl.searchParams.get("cafeId");
  if (typeof cafeId !== "string" || (!auth.isSuperAdmin && cafeId !== auth.cafeId) || !walletCampaignsEnabledForCafe(cafeId)) return json({ message: "Wallet notification settings are available to the Loretto pilot only." }, 403);
  if (!walletUpdatesEnabled()) return json({ message: "Wallet updates are disabled." }, 503);
  const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, isActive: true }, select: { rewardName: true, rewardTarget: true, businessType: true } });
  if (!cafe) return json({ message: "Active business not found." }, 404);
  if (request.method === "POST") {
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ message: "Use up to 100 characters for each optional message. Only notification messages and nearby settings can be edited here." }, 400);
    const current = await getWalletNotificationSettings(cafeId);
    const submitted = { ...parsed.data };
    Reflect.deleteProperty(submitted, "cafeId");
    const settings = { ...current, ...submitted };
    if (settings.nearbyEnabled && (settings.nearbyLatitude == null || settings.nearbyLongitude == null || !settings.nearbyMessage?.trim())) return json({ message: "Add your business’s latitude, longitude and nearby message before enabling nearby reminders." }, 400);
    await saveWalletNotificationSettings(cafeId, settings);
  }
  return json({ settings: await getWalletNotificationSettings(cafeId), rewardName: cafe.rewardName, target: getLoyaltyProgressTarget(cafe) });
}
async function respond(request: NextRequest) {
  try { return await handle(request); }
  catch { return json({ message: "Could not load or save Wallet notification settings. Try again." }, 500); }
}
export const GET = respond;
export const POST = respond;
