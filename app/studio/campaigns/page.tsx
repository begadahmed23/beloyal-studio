import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { prisma } from "@/lib/prisma";
import WalletCampaigns from "@/components/wallet/WalletCampaigns";
export default async function StudioCampaignsPage() {
  if (!await requireSuperAdmin(await headers())) redirect("/login");
  const businesses = await prisma.cafe.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <main className="min-h-screen bg-[#f6f6f7] px-2 py-5 sm:px-6"><div className="mx-auto max-w-6xl"><WalletCampaigns businesses={businesses} initialCafeId={businesses.find(b => /loretto/i.test(b.name))?.id ?? businesses[0]?.id ?? ""} studio /></div></main>;
}
