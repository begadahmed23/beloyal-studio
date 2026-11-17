import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import { walletUpdatesEnabled } from "./config";
import { googleWalletEnabled, googleWalletSavedObjects, googleWalletObjectId, sendGoogleWalletMessage } from "./google";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { passKey, walletRedis, notifyWalletMember } from "./updates";
import { getWalletMessage, setWalletMessage } from "./messages";
import { memberSegments, type CampaignMember, type CampaignSegment } from "./campaign-segments";

// Environment-isolated alongside existing Wallet registrations. No schema changes.
const prefix = () => `${passKey("campaigns")}:`;
export const campaignKey = (id: string) => `${prefix()}item:${id}`;
const historyKey = (cafeId: string) => `${prefix()}history:${cafeId}`;
export type CampaignRecipient = { id: string; name: string; memberNumber: string; status: "pending" | "accepted" | "failed" | "skipped"; acceptedDevices?: number; failedDevices?: number };
export type WalletCampaign = {
  id: string; cafeId: string; business: string; createdBy: string; segment: CampaignSegment;
  message: string; createdAt: number; sentAt?: number; status: "draft" | "sending" | "complete";
  recipients: CampaignRecipient[];
};
export async function walletAudience(cafeId: string, timezone: string, now = new Date()) {
  const members = await prisma.customer.findMany({ where: { cafeId }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 10001,
    select: { id: true, marketingConsentAt: true, marketingWithdrawnAt: true, name: true, memberNumber: true, birthday: true, createdAt: true, stamps: true, rewardEarnedAt: true, cafe: { select: { businessType: true, rewardTarget: true } },
      transactions: { where: { OR: [{ description: null }, { NOT: { description: { startsWith: "Feedback", mode: "insensitive" } } }] }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } });
  if (members.length > 10000) throw new Error("AUDIENCE_TOO_LARGE");
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId }, select: { slug: true } });
  const appleEnabled = walletUpdatesEnabled();
  const googleIds = cafe ? await googleWalletSavedObjects(cafe.slug) : new Set<string>();
  const totalMembers = await prisma.customer.count({where:{cafeId}});
  const audience: CampaignMember[] = [];
  let walletMembers = 0;
  // Pipeline lookups keep existing installs usable; only cards with a live registration qualify.
  for (let start = 0; start < members.length; start += 250) {
    const batch = members.slice(start, start + 250);
    const pipeline = walletRedis().pipeline();
    for (const member of batch) pipeline.hlen(passKey(member.id));
    const counts = appleEnabled ? await pipeline.exec<number[]>() : batch.map(() => 0);
    for (let i = 0; i < batch.length; i++) {
      const member = batch[i];
      const google = googleIds.size > 0 && googleIds.has(googleWalletObjectId(member.id));
      if ((!Number.isFinite(counts[i]) || counts[i] <= 0) && !google) continue;
      walletMembers++;
      if (!member.marketingConsentAt || member.marketingWithdrawnAt) continue;
      const lastVisit = member.transactions[0]?.createdAt ?? null;
      audience.push({ id: member.id, name: member.name, memberNumber: member.memberNumber, devices: (counts[i] || 0) + Number(google),
        lastVisitAt: lastVisit?.toISOString() ?? null, ...memberSegments(member.birthday, member.createdAt, lastVisit, now, timezone, Boolean(member.rewardEarnedAt) || member.stamps >= getLoyaltyProgressTarget(member.cafe)) });
    }
  }
  return { totalMembers, walletMembers, members: audience };
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
        const member = await prisma.customer.findFirst({ where: { id: recipient.id, cafeId: campaign.cafeId, marketingConsentAt: { not: null }, marketingWithdrawnAt: null }, select: { id: true, birthday: true, cafe: { select: { timezone: true } } } });
        if (!member) { recipient.status = "skipped"; return; }
        const birthday = campaign.segment === "birthday_today";
        const now = new Date();
        const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: member.cafe.timezone }).format(now);
        const cooldown = `${prefix()}cooldown:${campaign.cafeId}:${recipient.id}:${birthday ? `birthday:${year}` : "marketing"}`;
        // Claim before contacting providers: ambiguous failures must not allow repeated notifications.
        if (!await walletRedis().set(cooldown, campaign.id, { nx: true, ex: birthday ? 366 * 86400 : 86400 })) { recipient.status = "skipped"; return; }
        let accepted = 0, failed = 0;
        if (walletUpdatesEnabled() && await walletRedis().hlen(passKey(recipient.id)) && (await getWalletMessage(recipient.id))?.text !== campaign.message) {
          try {
            await setWalletMessage(recipient.id, campaign.message);
            const result = await notifyWalletMember(recipient.id);
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
