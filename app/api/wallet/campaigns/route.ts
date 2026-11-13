import { walletCampaignsEnabledForCafe } from "@/lib/wallet/campaign-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { walletUpdatesEnabled } from "@/lib/wallet/config";
import { walletRedis, passKey } from "@/lib/wallet/updates";
import { campaignSegments, MAX_CAMPAIGN_RECIPIENTS } from "@/lib/wallet/campaign-segments";
import { walletAudience, campaignHistory, createCampaign, getCampaign, sendCampaign } from "@/lib/wallet/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const previewSchema = z.object({ action: z.literal("preview"), cafeId: z.string().min(1).max(100),
  segment: z.enum(["all", "birthday_today", "birthday_week", "reward_ready", "inactive_14", "inactive_30"]),
  message: z.string().trim().min(1).max(180).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)),
  customerIds: z.array(z.string().min(1).max(100)).min(1).max(MAX_CAMPAIGN_RECIPIENTS).refine(ids => new Set(ids).size === ids.length),
});
const sendSchema = z.object({ action: z.literal("send"), cafeId: z.string().min(1).max(100), campaignId: z.string().uuid() });

async function handle(request: NextRequest) {
  const auth = await requireAuth(request.headers);
  if (!auth || auth.isCashier || (auth.user.role !== "SUPER_ADMIN" && auth.user.role !== "CAFE_ADMIN")) return json({ message: "Administrator access required." }, 403);
  if (!auth.isSuperAdmin) {
    const access = await requireActiveCafe(request.headers);
    if (!access.allowed) return json({ message: access.message }, access.status);
  }
  if (!walletUpdatesEnabled()) return json({ message: "Apple Wallet updates are not enabled." }, 503);
  if (request.method === "POST" && request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid request origin." }, 403);
  if (request.method === "POST" && Number(request.headers.get("content-length") ?? 0) > 16384) return json({ message: "Request too large." }, 413);
  const body = request.method === "POST" ? await request.json() : null;
  const cafeId = request.method === "POST" ? body?.cafeId : request.nextUrl.searchParams.get("cafeId");
  if (typeof cafeId !== "string" || !cafeId || cafeId.length > 100) return json({ message: "Choose a business." }, 400);
  if (!auth.isSuperAdmin && auth.cafeId !== cafeId) return json({ message: "Business access denied." }, 403);
  if (!walletCampaignsEnabledForCafe(cafeId)) return json({ message: "Wallet campaigns are currently available for the Loretto pilot only." }, 403);
  const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, isActive: true }, select: { id: true, name: true, timezone: true, rewardName: true } });
  if (!cafe) return json({ message: "Active business not found." }, 404);
  if (request.method === "GET") {
    const [audience, history] = await Promise.all([walletAudience(cafeId, cafe.timezone), campaignHistory(cafeId)]);
    const counts = Object.fromEntries(campaignSegments.map(segment => [segment.id, audience.members.filter(member => member.segments.includes(segment.id)).length]));
    return json({ cafe, ...audience, counts, history, maxRecipients: MAX_CAMPAIGN_RECIPIENTS });
  }
  if (body?.action === "preview") {
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) return json({ message: "Choose up to 50 members and write a card update of 1–180 characters." }, 400);
    const audience = await walletAudience(cafeId, cafe.timezone);
    const selected = new Set(parsed.data.customerIds);
    const recipients = audience.members.filter(member => selected.has(member.id) && member.segments.includes(parsed.data.segment));
    if (recipients.length !== selected.size) return json({ message: "Your audience has changed. Refresh the list and choose recipients again." }, 409);
    const campaign = await createCampaign({ cafeId, business: cafe.name, createdBy: auth.user.id, segment: parsed.data.segment, message: parsed.data.message,
      recipients: recipients.map(member => ({ id: member.id, name: member.name, memberNumber: member.memberNumber, status: "pending" })) });
    return json({ campaign });
  }
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return json({ message: "Invalid campaign request." }, 400);
  const campaign = await getCampaign(parsed.data.campaignId);
  if (!campaign || campaign.cafeId !== cafeId || campaign.createdBy !== auth.user.id) return json({ message: "Preview expired or unavailable. Review your message again." }, 404);
  if (campaign.status !== "draft") return json({ campaign });
  // Avoid overlapping campaigns overwriting the same card field mid-delivery.
  const lock = `${passKey("campaigns")}:business-lock:${cafeId}`;
  if (!await walletRedis().set(lock, campaign.id, { nx: true, ex: 300 })) return json({ message: "A campaign is already running for this business. Try again shortly." }, 409);
  try {
    const audience = await walletAudience(cafeId, cafe.timezone);
    const eligibleIds = new Set(audience.members.filter(member => member.segments.includes(campaign.segment)).map(member => member.id));
    return json({ campaign: await sendCampaign(campaign, eligibleIds) });
  }
  finally {
    await walletRedis().eval("if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end", [lock], [campaign.id]);
  }
}
async function respond(request: NextRequest) {
  try { return await handle(request); }
  catch (error) {
    if (error instanceof Error && error.message === "AUDIENCE_TOO_LARGE") return json({ message: "This business has over 10,000 members. Campaign audience pagination is required before sending." }, 503);
    if (error instanceof SyntaxError) return json({ message: "Invalid request." }, 400);
    console.error("Wallet campaign request failed.");
    return json({ message: "Could not complete this request. Refresh campaign history before trying to send again." }, 500);
  }
}
export const GET = respond;
export const POST = respond;
