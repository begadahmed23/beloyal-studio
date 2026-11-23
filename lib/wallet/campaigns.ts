import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import { walletPassTypesForBusiness, walletUpdatesEnabled } from "./config";
import { googleWalletEnabled, googleWalletSavedObjects, googleWalletObjectId, sendGoogleWalletMessage } from "./google";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { passKey, walletRedis, notifyWalletMember } from "./updates";
import { getWalletMessage, setWalletMessage } from "./messages";
import { memberSegments, type CampaignMember, type CampaignSegment } from "./campaign-segments";

// Environment-isolated alongside existing Wallet registrations.
const prefix = () => `${passKey("campaigns")}:`;
export const campaignKey = (id: string) => `${prefix()}item:${id}`;
const historyKey = (cafeId: string) => `${prefix()}history:${cafeId}`;
export type CampaignRecipient = { id: string; name: string; memberNumber: string; status: "pending" | "accepted" | "failed" | "skipped"; acceptedDevices?: number; failedDevices?: number };
export type WalletCampaign = {
  id: string; cafeId: string; business: string; createdBy: string; segment: CampaignSegment;
  message: string; createdAt: number; sentAt?: number; status: "draft" | "sending" | "complete";
  recipients: CampaignRecipient[];
};
export async function walletAudience(cafeId: string, timezone: string, now = new Date(), selectedIds?: string[]) {
  const members = await prisma.customer.findMany({
    where: { cafeId, ...(selectedIds ? { id: { in: selectedIds } } : {}) },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: selectedIds?.length ?? 10001,
    select: { id: true, marketingConsentAt: true, marketingWithdrawnAt: true, name: true, memberNumber: true, birthday: true, createdAt: true, stamps: true, rewardEarnedAt: true, cafe: { select: { businessType: true, rewardTarget: true } },
      joinLocation: { select: { name: true } },
      transactions: { where: { OR: [{ description: null }, { NOT: { description: { startsWith: "Feedback", mode: "insensitive" } } }] }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } });
  if (members.length > 10000) throw new Error("AUDIENCE_TOO_LARGE");
  if (!members.length) return { totalMembers: 0, walletMembers: 0, members: [], googleUnavailable: false };
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId }, select: { slug: true } });
  const appleEnabled = walletUpdatesEnabled();
  const passTypes = appleEnabled ? walletPassTypesForBusiness(cafe?.slug) : [];
  let googleIds = new Set<string>();
  let googleUnavailable = false;
  if (cafe) {
    try {
      googleIds = await googleWalletSavedObjects(cafe.slug);
    } catch {
      if (!appleEnabled) throw new Error("WALLET_AUDIENCE_UNAVAILABLE");
      googleUnavailable = true;
      console.warn("Google Wallet audience lookup failed.");
    }
  }
  const audience: CampaignMember[] = [];
  // Pipeline lookups keep existing installs usable; only cards with a live registration qualify.
  for (let start = 0; start < members.length; start += 250) {
    const batch = members.slice(start, start + 250);
    let counts: number[] = [];
    if (appleEnabled) {
      const pipeline = walletRedis().pipeline();
      for (const member of batch) {
        for (const type of passTypes) pipeline.hlen(passKey(member.id, type));
      }
      counts = await pipeline.exec<number[]>();
    }
    for (let i = 0; i < batch.length; i++) {
      const member = batch[i];
      const google = googleIds.size > 0 && googleIds.has(googleWalletObjectId(member.id));
      const apple = passTypes.reduce((total, _, offset) => total + (counts[i * passTypes.length + offset] || 0), 0);
      if (!apple && !google) continue;
      const offersStatus = member.marketingWithdrawnAt ? "withdrawn" : member.marketingConsentAt ? "enabled" : "missing";
      const lastVisit = member.transactions[0]?.createdAt ?? null;
      audience.push({ id: member.id, name: member.name, memberNumber: member.memberNumber, devices: apple + Number(google), offersStatus,
        joinLocationName: member.joinLocation?.name ?? null,
        lastVisitAt: lastVisit?.toISOString() ?? null, ...memberSegments(member.birthday, member.createdAt, lastVisit, now, timezone, Boolean(member.rewardEarnedAt) || member.stamps >= getLoyaltyProgressTarget(member.cafe)) });
    }
  }
  return { totalMembers: members.length, walletMembers: audience.length, members: audience, googleUnavailable };
}
export async function saveCampaign(campaign: WalletCampaign) {
  await walletRedis().set(campaignKey(campaign.id), campaign, { ex: campaign.status === "draft" ? 600 : 30 * 86400 });
}
export async function createCampaign(data: Omit<WalletCampaign, "id" | "createdAt" | "status">) {
  const campaign: WalletCampaign = { ...data, id: randomUUID(), createdAt: Date.now(), status: "draft" };
  await saveCampaign(campaign);
  return campaign;
}
export async function getCampaign(id: string) { return walletRedis().get<WalletCampaign>(campaignKey(id)); }
export async function campaignHistory(cafeId: string) {
  const ids = await walletRedis().zrange<string[]>(historyKey(cafeId), 0, 9, { rev: true });
  if (!ids.length) return [];
  const records = await walletRedis().mget<(WalletCampaign | null)[]>(...ids.map(campaignKey));
  return records.filter((value): value is WalletCampaign => Boolean(value));
}
export async function deleteCampaignHistoryEntry(cafeId: string, id: string) {
  const campaign = await getCampaign(id);
  if (!campaign || campaign.cafeId !== cafeId) return "missing";
  if (campaign.status !== "complete") return "unfinished";

  await walletRedis().multi()
    .zrem(historyKey(cafeId), id)
    .del(campaignKey(id))
    .exec();
  return "deleted";
}
export async function sendCampaign(campaign: WalletCampaign, eligibleIds: Set<string>) {
  // Persistent claim: a repeat click or HTTP retry cannot send this campaign twice.
  if (!await walletRedis().set(`${campaignKey(campaign.id)}:claimed`, "1", { nx: true, ex: 30 * 86400 })) return getCampaign(campaign.id);
  campaign.status = "sending"; campaign.sentAt = Date.now();
  await saveCampaign(campaign);
  await walletRedis().zadd(historyKey(campaign.cafeId), { score: campaign.sentAt, member: campaign.id });
  await walletRedis().zremrangebyrank(historyKey(campaign.cafeId), 0, -21);
  for (let start = 0; start < campaign.recipients.length; start += 5) {
    await Promise.all(campaign.recipients.slice(start, start + 5).map(async recipient => {
      try {
        if (!eligibleIds.has(recipient.id)) { recipient.status = "skipped"; return; }
        // Recheck ownership and registration at send time (e.g. pass removed after preview).
        const member = await prisma.customer.findFirst({ where: { id: recipient.id, cafeId: campaign.cafeId, marketingConsentAt: { not: null }, marketingWithdrawnAt: null }, select: { cafe: { select: { slug: true, timezone: true } } } });
        if (!member) { recipient.status = "skipped"; return; }
        if (campaign.segment === "birthday_today") {
          const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: member.cafe.timezone }).format(new Date());
          const birthdayKey = `${prefix()}cooldown:${campaign.cafeId}:${recipient.id}:birthday:${year}`;
          if (!await walletRedis().set(birthdayKey, campaign.id, { nx: true, ex: 366 * 86400 })) { recipient.status = "skipped"; return; }
        }
        let accepted = 0, failed = 0;
        const appleRegistrations = walletUpdatesEnabled() ? await Promise.all(
          walletPassTypesForBusiness(member.cafe.slug).map(type => walletRedis().hlen(passKey(recipient.id, type))),
        ) : [];
        if (appleRegistrations.some(count => count > 0) && (await getWalletMessage(recipient.id))?.text !== campaign.message) {
          try {
            await setWalletMessage(recipient.id, campaign.message);
            const result = await notifyWalletMember(recipient.id, false, member.cafe.slug);
            accepted += result?.accepted ?? 0; failed += result?.failed ?? 0;
          } catch { failed++; }
        }
        if (googleWalletEnabled() && process.env.GOOGLE_WALLET_CAMPAIGNS_ENABLED === "true") {
          try { if (await sendGoogleWalletMessage(recipient.id, campaign.id, campaign.business, campaign.message)) accepted++; }
          catch { failed++; }
        }
        recipient.acceptedDevices = accepted;
        recipient.failedDevices = failed;
        recipient.status = accepted ? "accepted" : failed ? "failed" : "skipped";
      } catch { recipient.status = "failed"; }
    }));
    await saveCampaign(campaign);
  }
  campaign.status = "complete";
  await saveCampaign(campaign);
  return campaign;
}
