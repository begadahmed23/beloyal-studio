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
    select: { id: true, name: true, memberNumber: true, birthday: true, createdAt: true,
      transactions: { where: { OR: [{ description: null }, { NOT: { description: { startsWith: "Feedback", mode: "insensitive" } } }] }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } });
  if (members.length > 10000) throw new Error("AUDIENCE_TOO_LARGE");
  const audience: CampaignMember[] = [];
  // Pipeline lookups keep existing installs usable; only cards with a live registration qualify.
  for (let start = 0; start < members.length; start += 250) {
    const batch = members.slice(start, start + 250);
    const pipeline = walletRedis().pipeline();
    for (const member of batch) pipeline.hlen(passKey(member.id));
    const counts = await pipeline.exec<number[]>();
    for (let i = 0; i < batch.length; i++) {
      if (!Number.isFinite(counts[i]) || counts[i] <= 0) continue;
      const member = batch[i];
      const lastVisit = member.transactions[0]?.createdAt ?? null;
      audience.push({ id: member.id, name: member.name, memberNumber: member.memberNumber, devices: counts[i],
        lastVisitAt: lastVisit?.toISOString() ?? null, ...memberSegments(member.birthday, member.createdAt, lastVisit, now, timezone) });
    }
  }
  return { totalMembers: members.length, members: audience };
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
        const member = await prisma.customer.findFirst({ where: { id: recipient.id, cafeId: campaign.cafeId }, select: { id: true } });
        if (!member || !await walletRedis().hlen(passKey(recipient.id))) { recipient.status = "skipped"; return; }
        if ((await getWalletMessage(recipient.id))?.text === campaign.message) { recipient.status = "skipped"; return; }
        await setWalletMessage(recipient.id, campaign.message);
        const result = await notifyWalletMember(recipient.id);
        recipient.acceptedDevices = result?.accepted ?? 0;
        recipient.failedDevices = result?.failed ?? 0;
        recipient.status = result?.accepted ? "accepted" : "failed";
      } catch { recipient.status = "failed"; }
    }));
    await saveCampaign(campaign);
  }
  campaign.status = "complete";
  await saveCampaign(campaign);
  return campaign;
}
