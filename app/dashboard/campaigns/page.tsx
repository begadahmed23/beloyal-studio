import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import WalletCampaigns from "@/components/wallet/WalletCampaigns";
export default async function CampaignsPage() {
  const auth = await requireAuth(await headers());
  if (!auth) redirect("/login");
  if (auth.isSuperAdmin) redirect("/studio/campaigns");
  if (auth.isCashier || !auth.cafe || !auth.cafeId) redirect("/dashboard");
  return <WalletCampaigns businesses={[{ id: auth.cafeId, name: auth.cafe.name }]} initialCafeId={auth.cafeId} />;
}
